import { createServer } from 'node:http';
import Redis from 'ioredis';

const PORT = Number(process.env.PORT ?? 13001);
const FRONT_URL = process.env.VITE_FRONT_URL ?? '';

// -- Redis cache ------------------------------------------------------------

const SERVER_NAME = process.env.RAILWAY_SERVICE_NAME ?? 'bike-tracker-server';

const redis = new Redis(
  process.env.REDIS_URL ?? 'redis://redis.railway.internal:6379',
  {
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  },
);

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
  if (!FRONT_URL) return origin; // dev: allow all
  if (origin === FRONT_URL) return origin;
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

// -- Route handlers ---------------------------------------------------------

async function handleFreeBikeStatus(res, provider) {
  const cached = await getCache(`${provider}_bikes`);
  if (cached) return sendJson(res, 200, cached);

  const r = await fetch(FREE_BIKE_URLS[provider]);
  if (!r.ok) throw new Error(`upstream returned ${r.status}`);
  const data = await r.json();
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
      stationCode: s.stationCode ?? info.stationCode,
      name: info.name ?? null,
      lat,
      lon,
      capacity: info.capacity ?? null,
      num_bikes_available: s.num_bikes_available ?? s.numBikesAvailable ?? 0,
      mechanical: types.find((t) => t.mechanical != null)?.mechanical ?? 0,
      ebike: types.find((t) => t.ebike != null)?.ebike ?? 0,
      num_docks_available: s.num_docks_available ?? s.numDocksAvailable ?? 0,
      is_installed: s.is_installed,
      is_renting: s.is_renting,
      is_returning: s.is_returning,
      last_reported: s.last_reported ?? null,
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
