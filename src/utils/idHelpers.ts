/**
 * Small shared helpers for deriving stable source ids from human-friendly
 * names. Used on import, layer creation, and duplication so every source
 * ends up with a unique, kebab-case id.
 */

export const slugifyId = (value: string): string =>
  (value ?? '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Return a unique id based on `base`, avoiding any collision with `taken`.
 * Falls back to `layer` when the input slugifies to an empty string.
 * The returned id is NOT added to `taken` — callers should add it if they
 * want subsequent calls to keep unique.
 */
export const uniqueId = (base: string, taken: Set<string>): string => {
  const slug = slugifyId(base) || 'layer';
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
};

/**
 * Ensure every source in `sources` has a non-empty `id`, filling missing
 * ones from `slugifyId(name)` and de-duping across the array. Returns a
 * new array; individual source objects are shallow-cloned only when
 * they had to be modified.
 */
export const ensureSourceIds = <T extends { id?: string; name?: string }>(
  sources: T[],
): T[] => {
  if (!Array.isArray(sources)) return sources;
  const taken = new Set<string>();
  // Seed with existing non-empty ids so we don't collide with them.
  for (const s of sources) {
    if (s && typeof s.id === 'string' && s.id.trim()) taken.add(s.id.trim());
  }
  return sources.map((s) => {
    if (!s) return s;
    if (typeof s.id === 'string' && s.id.trim()) return s;
    const id = uniqueId(s.name ?? '', taken);
    taken.add(id);
    return { ...s, id };
  });
};
