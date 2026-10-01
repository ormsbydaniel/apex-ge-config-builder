import { describe, it, expect } from 'vitest';
import { resolveRecipeBands, matchRecipe, computeStretch, tidyStretch, guessSensor } from '../recipes';

const bins = Array.from({ length: 100 }, (_, i) => ({ x: i * 100, count: 1 }));

describe('rgb recipes', () => {
  it('resolves Sentinel-2 L2A by band count', () => {
    expect(resolveRecipeBands('natural', 12)).toEqual([4, 3, 2]);
    expect(resolveRecipeBands('agriculture', 12)).toEqual([11, 8, 2]);
    expect(resolveRecipeBands('geology', 13)).toEqual([13, 12, 4]);
  });
  it('prefers band labels over band count', () => {
    const labels = ['B02 Blue', 'B03 Green', 'B04 Red', 'B08 NIR'];
    expect(resolveRecipeBands('natural', 4, labels)).toEqual([3, 2, 1]);
    expect(resolveRecipeBands('false-colour-ir', 4, labels)).toEqual([4, 3, 2]);
  });
  it('returns null when unsupported', () => {
    expect(resolveRecipeBands('agriculture', 4)).toBeNull();
    expect(resolveRecipeBands('natural', 9)).toBeNull();
    expect(guessSensor(9)).toBeNull();
  });
  it('matches bands back to a recipe', () => {
    expect(matchRecipe([8, 4, 3], 12)).toBe('false-colour-ir');
    expect(matchRecipe([1, 5, 9], 12)).toBe('custom');
  });
});

describe('stretches', () => {
  it('min-max uses histogram bounds', () => {
    expect(computeStretch('min-max', { bins, min: 0, max: 9900 })).toEqual({ min: 0, max: 9900 });
  });
  it('2-98% cuts the tails', () => {
    const s = computeStretch('percent-2-98', { bins, min: 0, max: 9900 });
    expect(s.min).toBeGreaterThan(0);
    expect(s.max).toBeLessThan(9900);
  });
  it('mean ± 2σ stays within data', () => {
    const s = computeStretch('mean-2sd', { bins, min: 0, max: 9900 });
    expect(s.min).toBeGreaterThanOrEqual(0);
    expect(s.max).toBeLessThanOrEqual(9900);
  });
  it('tidies outward', () => {
    expect(tidyStretch(123.456, 4567.8)).toEqual({ min: 100, max: 4600 });
  });
});
