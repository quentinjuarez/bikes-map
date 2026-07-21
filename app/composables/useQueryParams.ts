import { useProfileStore } from '../stores/profile';
import { type Provider, ALL_PROVIDERS, UNSET } from '../types';
import { theme, type Theme } from './useTheme';

/**
 * Reads lat/lng + filter query params and hydrates the store.
 * Returns true if a valid position was found.
 */
export function applyQueryParams(search: string): boolean {
  const store = useProfileStore();
  const params = new URLSearchParams(search);

  const lat = parseFloat(params.get('lat') ?? '');
  const lng = parseFloat(params.get('lng') ?? '');
  if (isNaN(lat) || isNaN(lng)) return false;

  store.setPosition(lat, lng, 'manual');

  const rawProviders = params.get('providers');
  if (rawProviders) {
    const parsed = rawProviders
      .split(',')
      .filter((p): p is Provider => (ALL_PROVIDERS as string[]).includes(p));
    if (parsed.length > 0) store.providers = parsed;
  }

  const limit = parseInt(params.get('limit') ?? '');
  if (!isNaN(limit)) store.setLimit(limit);

  const maxDist = parseInt(params.get('maxDist') ?? '');
  if (!isNaN(maxDist)) store.setMaxDistance(maxDist === 0 ? UNSET : maxDist);

  const minBat = parseInt(params.get('minBat') ?? '');
  if (!isNaN(minBat)) store.setMinBattery(minBat === 0 ? UNSET : minBat);

  const rawTheme = params.get('theme') as Theme | null;
  if (rawTheme === 'dark' || rawTheme === 'light') theme.value = rawTheme;

  return true;
}
