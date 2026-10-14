import { describe, it, expect } from 'vitest';
import { applyStyleFields, diffKeys, extractStyleFields, validateStyleFields } from '../styleJsonScope';

const items: any[] = [
  { url: 'a', format: 'cog', zIndex: 1, style: { color: 1 }, opacity: 0.5 },
  { url: 'b', format: 'cog', zIndex: 1, style: { color: 2 } },
];

describe('styleJsonScope', () => {
  it('extracts only shown keys', () => {
    expect(extractStyleFields(items[0], ['style'])).toEqual({ style: { color: 1 } });
  });
  it('detects differing keys', () => {
    expect(diffKeys(items, ['style', 'display'])).toEqual(['style', 'opacity']);
  });
  it('applies to selected datasets only and removes deleted shown keys', () => {
    const out = applyStyleFields(items, [0], { style: { x: 1 } }, ['style', 'display']);
    expect(out[0]).toEqual({ url: 'a', format: 'cog', style: { x: 1 } });
    expect(out[1]).toBe(items[1]);
  });
  it('validates values', () => {
    expect(validateStyleFields({ opacity: 2, url: 'x' }, ['display'])).toHaveLength(2);
    expect(validateStyleFields({ opacity: 0.3 }, ['display'])).toEqual([]);
  });
});
