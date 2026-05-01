import { describe, it, expect } from 'vitest';
import { categoriesToCsv, parseCategoriesCsv } from '../categoryCsv';

describe('categoryCsv', () => {
  it('round-trips with values', () => {
    const cats = [
      { label: 'Forest', color: '#2e7d32', value: 1 },
      { label: 'Water', color: '#1565c0', value: 2 },
    ];
    const csv = categoriesToCsv(cats, true);
    const parsed = parseCategoriesCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.useValues).toBe(true);
    expect(parsed.categories).toEqual(cats);
  });

  it('round-trips without values', () => {
    const cats = [
      { label: 'A', color: '#ff0000', value: 0 },
      { label: 'B', color: '#00ff00', value: 1 },
    ];
    const csv = categoriesToCsv(cats, false);
    const parsed = parseCategoriesCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.useValues).toBe(false);
    expect(parsed.categories).toHaveLength(2);
  });

  it('handles quoted labels with commas', () => {
    const csv = 'label,color,value\n"Mixed, urban",#9e9e9e,3\n';
    const parsed = parseCategoriesCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.categories[0].label).toBe('Mixed, urban');
  });

  it('rejects invalid hex colors', () => {
    const csv = 'label,color,value\nFoo,not-a-color,1\n';
    const parsed = parseCategoriesCsv(csv);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].row).toBe(2);
  });

  it('rejects duplicate values', () => {
    const csv = 'label,color,value\nA,#ff0000,1\nB,#00ff00,1\n';
    const parsed = parseCategoriesCsv(csv);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].message).toMatch(/Duplicate/);
  });

  it('errors when header lacks required columns', () => {
    const csv = 'foo,bar\n1,2\n';
    const parsed = parseCategoriesCsv(csv);
    expect(parsed.errors[0].message).toMatch(/label.*color/);
  });

  it('detects useValues from header presence', () => {
    const withValues = parseCategoriesCsv('label,color,value\nA,#ff0000,5\n');
    const withoutValues = parseCategoriesCsv('label,color\nA,#ff0000\n');
    expect(withValues.useValues).toBe(true);
    expect(withoutValues.useValues).toBe(false);
  });
});
