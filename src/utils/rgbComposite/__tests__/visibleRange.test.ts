import { describe, it, expect } from 'vitest';
import { buildIndexStyle, withVisibleRange } from '../indices';
import { DataSourceItemSchema } from '@/schemas/configSchema';

const base = { recipe: 'ndwi' as const, bandA: 3, bandB: 8, colormap: 'rdbu', reverse: true, min: -1, max: 1 };

describe('visible range mask', () => {
  it('leaves the style unchanged when nothing is hidden', () => {
    const cfg = withVisibleRange(base, -1, 1);
    expect(cfg).not.toHaveProperty('visibleMin');
    expect(cfg).not.toHaveProperty('visibleMax');
    expect(buildIndexStyle(cfg)).toEqual(buildIndexStyle(base));
  });
  it('adds transparent branches for narrowed bounds', () => {
    const style = buildIndexStyle(withVisibleRange(base, 0, 1)) as any;
    expect(style.color.length).toBe(buildIndexStyle(base).color.length + 2);
    expect(style.color[3][0]).toBe('<');
    expect(style.color[3][2]).toBe(0);
  });
  it('survives schema validation', () => {
    const r = DataSourceItemSchema.safeParse({ url: 'https://x/a.tif', format: 'cog', zIndex: 0, spectralIndex: withVisibleRange(base, 0, 0.8) });
    expect(r.success).toBe(true);
    expect((r as any).data.spectralIndex.visibleMin).toBe(0);
  });
});
