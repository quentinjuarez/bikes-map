import { createServer } from 'node:http';
import Redis from 'ioredis';

const PORT = Number(process.env.PORT ?? 13001);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

// -- Redis cache ------------------------------------------------------------

const SERVER_NAME = process.env.RAILWAY_SERVICE_NAME ?? 'bike-tracker-server';

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 3000,
  maxRetriesPerRequest: 1,
});

let cacheEnabled = false;

redis.on('error', (err) => {
  if (cacheEnabled) {
    console.warn('[redis] connection lost — cache disabled:', err.message);
    cacheEnabled = false;
  }
});

async function connectRedis() {
  try {
    await redis.connect();
    await redis.ping();
    cacheEnabled = true;
    console.log('[redis] connected — cache enabled');
  } catch (err) {
    console.warn('[redis] unavailable — cache disabled:', err.message);
  }
}

function cacheKey(key) {
  return `${SERVER_NAME}:${key}`;
}

async function setCache(key, data, ttlSeconds) {
  if (!cacheEnabled) return;
  try {
    await redis.set(cacheKey(key), JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('[redis] setCache failed:', err.message);
    cacheEnabled = false;
  }
}

async function getCache(key) {
  if (!cacheEnabled) return null;
  try {
    const raw = await redis.get(cacheKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[redis] getCache failed:', err.message);
    cacheEnabled = false;
    return null;
  }
}

// -- Rate limiter -----------------------------------------------------------

const rateMap = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_MAX) return true;
  entry.count++;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, v] of rateMap) {
    if (now > v.resetAt) rateMap.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// -- Helpers ----------------------------------------------------------------

function getAllowedOrigin(origin) {
  if (!origin) return null; // no browser origin (curl/server) -> OK, skip CORS header
  if (ALLOWED_ORIGINS.length === 0) return origin; // dev: allow all
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return false; // rejected
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// -- Provider URLs ----------------------------------------------------------

const FREE_BIKE_URLS = {
  lime: 'https://data.lime.bike/api/partners/v2/gbfs/paris/free_bike_status',
  voi: 'https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/352/free_bike_status.json',
  dott: 'https://gbfs.api.ridedott.com/public/v2/paris/free_bike_status.json',
};

const VELIB_BASE =
  'https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole';

// -- Parsers ----------------------------------------------------------------

// Max range per vehicle_type_id (metres) — used to derive battery % when the
// provider only gives current_range_meters instead of current_fuel_percent.
const MAX_RANGE = {
  // Lime
  1: 24140,
  2: 40233,
  3: 85000,
  // Voi
  voi_scooter: 80000,
  voi_bike: 80000,
  // Dott
  dott_bicycle: 100000,
};

/**
 * Compute 0–100 integer battery percent from raw GBFS fields.
 * Returns null when not determinable.
 */
function computeBattery(b) {
  if (b.current_fuel_percent != null) {
    return Math.min(100, Math.round(Number(b.current_fuel_percent) * 100));
  }
  const maxRange = b.vehicle_type_id ? MAX_RANGE[b.vehicle_type_id] : undefined;
  if (b.current_range_meters != null && maxRange) {
    return Math.min(
      100,
      Math.round((Number(b.current_range_meters) / maxRange) * 100),
    );
  }
  return null;
}

/**
 * Strip a raw GBFS bike to the 4 fields the frontend actually uses.
 * Battery is pre-computed here so the frontend needs no VEHICLE_TYPES lookup.
 * Returns null for bikes with invalid coordinates (skipped by the caller).
 */
function parseBike(b) {
  const lat = Number(b.lat);
  const lon = Number(b.lon);
  if (isNaN(lat) || isNaN(lon)) return null;
  return {
    bike_id: b.bike_id,
    lat,
    lon,
    battery_percent: computeBattery(b),
  };
}

// -- Route handlers ---------------------------------------------------------

async function handleFreeBikeStatus(res, provider) {
  const cached = await getCache(`${provider}_bikes`);
  if (cached) return sendJson(res, 200, cached);

  const r = await fetch(FREE_BIKE_URLS[provider]);
  if (!r.ok) throw new Error(`upstream returned ${r.status}`);
  const raw = await r.json();

  const bikes = (raw.data?.bikes ?? []).map(parseBike).filter(Boolean);
  const data = { data: { bikes } };
  await setCache(`${provider}_bikes`, data, 30);
  sendJson(res, 200, data);
}

async function handleVelibStations(res) {
  const cached = await getCache('velib_stations');
  if (cached) return sendJson(res, 200, cached);

  let infoData = await getCache('velib_info');
  if (!infoData) {
    const r = await fetch(`${VELIB_BASE}/station_information.json`);
    if (!r.ok) throw new Error(`velib info upstream returned ${r.status}`);
    infoData = await r.json();
    await setCache('velib_info', infoData, 3600);
  }

  const statusRes = await fetch(`${VELIB_BASE}/station_status.json`);
  if (!statusRes.ok)
    throw new Error(`velib status upstream returned ${statusRes.status}`);
  const statusData = await statusRes.json();

  const infoMap = new Map();
  for (const s of infoData?.data?.stations ?? []) {
    infoMap.set(String(s.station_id), s);
  }

  const stations = (statusData?.data?.stations ?? []).reduce((acc, s) => {
    const info = infoMap.get(String(s.station_id));
    if (!info) return acc;
    const lat = Number(info.lat);
    const lon = Number(info.lon);
    if (isNaN(lat) || isNaN(lon)) return acc;
    const types = s.num_bikes_available_types ?? [];
    acc.push({
      station_id: String(s.station_id),
      lat,
      lon,
      num_bikes_available: s.num_bikes_available ?? s.numBikesAvailable ?? 0,
      mechanical: types.find((t) => t.mechanical != null)?.mechanical ?? 0,
      ebike: types.find((t) => t.ebike != null)?.ebike ?? 0,
      num_docks_available: s.num_docks_available ?? s.numDocksAvailable ?? 0,
      is_renting: s.is_renting,
    });
    return acc;
  }, []);

  const result = { stations };
  await setCache('velib_stations', result, 30);
  sendJson(res, 200, result);
}

// -- Server -----------------------------------------------------------------

const server = createServer(async (req, res) => {
  // CORS check
  const origin = req.headers['origin'];
  const allowedOrigin = getAllowedOrigin(origin);
  if (allowedOrigin === false) {
    return sendJson(res, 403, { error: 'CORS: origin not allowed' });
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  // Rate limiting
  const ip =
    String(req.headers['x-forwarded-for'] ?? '')
      .split(',')[0]
      .trim() ||
    req.socket.remoteAddress ||
    'unknown';
  if (isRateLimited(ip)) {
    return sendJson(res, 429, {
      error: 'Too many requests, please try again later.',
    });
  }

  // Routing
  const url = (req.url ?? '/').split('?')[0];
  try {
    if (url === '/health')
      return sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
    if (url === '/lime/free_bike_status')
      return await handleFreeBikeStatus(res, 'lime');
    if (url === '/voi/free_bike_status')
      return await handleFreeBikeStatus(res, 'voi');
    if (url === '/dott/free_bike_status')
      return await handleFreeBikeStatus(res, 'dott');
    if (url === '/velib/stations') return await handleVelibStations(res);
    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    sendJson(res, 502, { error: 'Upstream fetch failed' });
  }
});

server.listen(PORT, async () => {
  console.log(`Bike-tracker proxy running on http://localhost:${PORT}`);
  await connectRedis();
});
