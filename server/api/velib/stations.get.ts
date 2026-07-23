import { VELIB_BASE, parseVelibStations, type ParsedStation } from '~~/server/utils/gbfs';

// station_information rarely changes → cache 1h. status is live → 30s (below).
// Explicit return annotations avoid Nitro's typed-$fetch self-referential inference.
const getVelibInfo = defineCachedFunction(
  async (): Promise<unknown> => $fetch<unknown>(`${VELIB_BASE}/station_information.json`),
  { maxAge: 3600, name: 'velib_info', getKey: () => 'velib_info' },
);

// GET /api/velib/stations
export default defineCachedEventHandler(
  async (): Promise<{ stations: ParsedStation[] }> => {
    const [infoData, statusData] = await Promise.all([
      getVelibInfo(),
      $fetch<unknown>(`${VELIB_BASE}/station_status.json`),
    ]);
    return { stations: parseVelibStations(infoData as never, statusData as never) };
  },
  { maxAge: 30, name: 'velib_stations', getKey: () => 'velib_stations' },
);
