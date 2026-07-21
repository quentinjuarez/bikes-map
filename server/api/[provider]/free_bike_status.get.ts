import { FREE_BIKE_URLS, parseBike, type Provider, type ParsedBike } from '~~/server/utils/gbfs';

// GET /api/:provider/free_bike_status  (provider = lime | voi | dott)
// 30s Nitro cache absorbs upstream load — no Redis, no rate limiter needed.
export default defineCachedEventHandler(
  async (event) => {
    const provider = getRouterParam(event, 'provider') as Provider;
    const url = FREE_BIKE_URLS[provider];
    if (!url) {
      throw createError({ statusCode: 404, statusMessage: 'Unknown provider' });
    }

    const raw = await $fetch<{ data?: { bikes?: unknown[] } }>(url);
    const bikes = (raw.data?.bikes ?? [])
      .map((b) => parseBike(b as never))
      .filter((b): b is ParsedBike => b !== null);

    return { data: { bikes } };
  },
  {
    maxAge: 30,
    name: 'free_bike_status',
    getKey: (event) => `bikes:${getRouterParam(event, 'provider')}`,
  },
);
