import { VELIB_BASE, parseVelibStations } from '~~/server/utils/gbfs';

// station_information rarely changes → cache 1h. status is live → 30s (below).
const getVelibInfo = defineCachedFunction(
  async () => $fetch(`${VELIB_BASE}/station_information.json`),
  { maxAge: 3600, name: 'velib_info', getKey: () => 'velib_info' },
);

// GET /api/velib/stations
export default defineCachedEventHandler(
  async () => {
    const [infoData, statusData] = await Promise.all([
      getVelibInfo(),
      $fetch(`${VELIB_BASE}/station_status.json`),
    ]);
    return { stations: parseVelibStations(infoData as never, statusData as never) };
  },
  { maxAge: 30, name: 'velib_stations', getKey: () => 'velib_stations' },
);
