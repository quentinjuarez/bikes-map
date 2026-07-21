/** Average walking speed in meters per minute (~4.8 km/h) */
export const WALKING_SPEED_M_PER_MIN = 80;

/**
 * Convert a distance in meters to walking time in minutes (rounded).
 * Returns null if the distance is 0 or negative.
 */
export function metersToWalkMinutes(meters: number): number {
  return Math.round(meters / WALKING_SPEED_M_PER_MIN);
}

/**
 * Convert a walking time in minutes to a distance in meters.
 */
export function walkMinutesToMeters(minutes: number): number {
  return Math.round(minutes * WALKING_SPEED_M_PER_MIN);
}

/**
 * Human-readable label for a walking time in minutes.
 * e.g. 1 → "1 min walk", 5 → "5 min walk"
 */
export function walkMinutesLabel(minutes: number): string {
  return `${minutes} min walk`;
}
