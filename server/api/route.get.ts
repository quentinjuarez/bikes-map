// GET /api/route?fromLat&fromLng&toLat&toLng -> { geometry:[[lat,lng]...], distance, duration }
// Walking route via the keyless FOSSGIS Valhalla instance (pedestrian costing).
// ponytail: if the public instance rate-limits, swap the URL/parse for
// OpenRouteService (free key via runtimeConfig); the response contract stays the same.

// Valhalla encodes shapes as a polyline with precision 6.
function decodePolyline6(str: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: [number, number][] = [];
  const factor = 1e6;
  while (index < str.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / factor, lng / factor]);
  }
  return coords;
}

interface ValhallaResponse {
  trip?: {
    legs?: { shape?: string }[];
    summary?: { length?: number; time?: number };
  };
}

export default defineCachedEventHandler(
  async (event) => {
    const q = getQuery(event);
    const fromLat = Number(q.fromLat);
    const fromLng = Number(q.fromLng);
    const toLat = Number(q.toLat);
    const toLng = Number(q.toLng);
    if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
      throw createError({ statusCode: 400, statusMessage: 'from/to coordinates required' });
    }

    const json = JSON.stringify({
      locations: [
        { lat: fromLat, lon: fromLng },
        { lat: toLat, lon: toLng },
      ],
      costing: 'pedestrian',
      directions_options: { units: 'kilometers' },
    });
    const url = `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(json)}`;
    const data = await $fetch<ValhallaResponse>(url);

    const shape = data.trip?.legs?.[0]?.shape;
    if (!shape) throw createError({ statusCode: 502, statusMessage: 'No route found' });

    return {
      geometry: decodePolyline6(shape),
      distance: Math.round((data.trip?.summary?.length ?? 0) * 1000), // km -> m
      duration: Math.round(data.trip?.summary?.time ?? 0), // seconds
    };
  },
  {
    maxAge: 300,
    name: 'route',
    getKey: (event) => {
      const q = getQuery(event);
      const r = (v: unknown) => Number(v).toFixed(5);
      return `route:${r(q.fromLat)},${r(q.fromLng)}->${r(q.toLat)},${r(q.toLng)}`;
    },
  },
);
