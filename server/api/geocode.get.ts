// GET /api/geocode?q=...  -> [{ label, lat, lng }]
// Proxies the keyless French BAN geocoder (api-adresse.data.gouv.fr).
interface BanFeature {
  properties?: { label?: string };
  geometry?: { coordinates?: [number, number] };
}

export default defineCachedEventHandler(
  async (event) => {
    const q = String(getQuery(event).q ?? '').trim();
    if (q.length < 3) return [] as { label: string; lat: number; lng: number }[];

    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`;
    const data = await $fetch<{ features?: BanFeature[] }>(url);

    return (data.features ?? [])
      .map((f) => {
        const c = f.geometry?.coordinates;
        const label = f.properties?.label;
        if (!c || !label) return null;
        return { label, lat: c[1], lng: c[0] };
      })
      .filter((r): r is { label: string; lat: number; lng: number } => r !== null);
  },
  {
    maxAge: 3600,
    name: 'geocode',
    getKey: (event) =>
      `geo:${String(getQuery(event).q ?? '')
        .trim()
        .toLowerCase()}`,
  },
);
