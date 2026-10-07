import { describe, expect, it } from 'vitest';
import { DataSourceItemSchema } from '@/schemas/configSchema';
import { buildComputedStyle, resolveComputedBands, type ComputedCompositeConfig } from './computed';

const cfg: ComputedCompositeConfig = { recipe: 'barren-soil', bands: [1, 3, 7, 9], inputScale: 'dn' };
function evaluate(expr: any, bands: number[]): any {
  if (!Array.isArray(expr)) return expr;
  const [op, ...args] = expr;
  const v = args.map((a: any) => evaluate(a, bands));
  switch (op) {
    case 'band': return bands[v[0] - 1];
    case '+': return v[0] + v[1];
    case '-': return v[0] - v[1];
    case '*': return v[0] * v[1];
    case '/': return v[0] / v[1];
    case '==': return v[0] === v[1];
    case 'any': return v.some(Boolean);
    case 'case': return v[0] ? v[1] : v[2];
    case 'clamp': return Math.min(v[2], Math.max(v[1], v[0]));
    case 'array': return v;
    default: throw Error(op);
  }
}
describe('openEO barren soil', () => {
  it('maps existing sensor profiles and labelled stacks', () => {
    expect(resolveComputedBands(10)).toEqual([1, 3, 7, 9]);
    expect(resolveComputedBands(12)).toEqual([2, 4, 8, 11]);
    expect(resolveComputedBands(13)).toEqual([2, 4, 8, 12]);
    expect(resolveComputedBands(7)).toEqual([2, 4, 5, 6]);
    expect(resolveComputedBands(4, ['B11', 'B08', 'B04', 'B02'])).toEqual([4, 3, 2, 1]);
    expect(resolveComputedBands(3)).toBeNull();
  });
  it('matches graph fixtures and clamps display channels', () => {
    const values = [1000, 2000, 3000, 5000];
    const result = evaluate(buildComputedStyle(cfg).color, values);
    expect(result[0]).toBeCloseTo(2.5 * (7000 - 4000) / 11000);
    expect(result.slice(1)).toEqual([0.3, 0.5, 1]);
    expect(evaluate(buildComputedStyle(cfg).color, [100, 100, 9000, 10])[0]).toBe(0);
    evaluate(buildComputedStyle({ ...cfg, inputScale: 'reflectance' }).color, values.map((x) => x / 10000)).forEach((v: number, i: number) => expect(v).toBeCloseTo(result[i]));
  });
  it('masks NoData and handles zero denominators without NaN', () => {
    expect(evaluate(buildComputedStyle(cfg).color, [0, 0, 0, 0])).toEqual([0, 0, 0, 0]);
    expect(evaluate(buildComputedStyle({ ...cfg, noData: -9999 }).color, [-9999, 2000, 3000, 5000])[3]).toBe(0);
  });
  it('preserves computed metadata through validation and JSON round-trip', () => {
    const item = { url: 'https://example.org/scene.tif', format: 'cog', zIndex: 1, bands: cfg.bands, normalize: false, computedComposite: cfg, style: buildComputedStyle(cfg) };
    expect(DataSourceItemSchema.parse(JSON.parse(JSON.stringify(item)))).toEqual(item);
    expect(DataSourceItemSchema.safeParse({ ...item, computedComposite: { ...cfg, bands: [1, 1, 2, 3] } }).success).toBe(false);
  });
});