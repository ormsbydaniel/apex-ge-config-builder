/** Pure helpers converting between drawn map rectangles and bbox input values. */

const round = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Two corner points (any order) → [W, S, E, N] strings, rounded and clamped. */
export function cornersToBboxValues(a: { lat: number; lng: number }, b: { lat: number; lng: number }): string[] {
  const west = clamp(Math.min(a.lng, b.lng), -180, 180);
  const east = clamp(Math.max(a.lng, b.lng), -180, 180);
  const south = clamp(Math.min(a.lat, b.lat), -90, 90);
  const north = clamp(Math.max(a.lat, b.lat), -90, 90);
  return [west, south, east, north].map((n) => String(round(n)));
}

/** [W, S, E, N] strings → numeric bbox, or null when incomplete/invalid. */
export function bboxValuesToBounds(values: string[]): [number, number, number, number] | null {
  if (values.length !== 4 || values.some((v) => v.trim() === '')) return null;
  const nums = values.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [w, s, e, n] = nums;
  if (w >= e || s >= n) return null;
  return [w, s, e, n];
}
