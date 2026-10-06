import { describe, it, expect } from 'vitest';
import { resolveRecipeBands, matchRecipe, computeStretch, tidyStretch, guessSensor, sharedStretchMethod } from '../recipes';

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
  it('resolves Sentinel-2 ARD (10 bands, no B01/B09/B10)', () => {
    expect(guessSensor(10)).toBe('sentinel2-ard');
    expect(resolveRecipeBands('natural', 10)).toEqual([3, 2, 1]);
    expect(resolveRecipeBands('false-colour-ir', 10)).toEqual([7, 3, 2]);
    expect(resolveRecipeBands('agriculture', 10)).toEqual([9, 7, 1]);
    expect(resolveRecipeBands('geology', 10)).toEqual([10, 9, 3]);
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
  it('shows a shared method only when all channel selections agree', () => {
    expect(sharedStretchMethod(['percent-2-98', 'percent-2-98', 'percent-2-98'])).toBe('percent-2-98');
    expect(sharedStretchMethod(['percent-2-98', 'min-max', 'percent-2-98'])).toBeNull();
    expect(sharedStretchMethod(['percent-2-98', null, 'percent-2-98'])).toBeNull();
    expect(sharedStretchMethod([null, null, null])).toBeNull();
    expect(sharedStretchMethod(['min-max', 'min-max', 'min-max'])).toBe('min-max');
  });
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
