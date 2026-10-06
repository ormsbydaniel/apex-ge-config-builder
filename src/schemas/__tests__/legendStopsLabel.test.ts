import { describe, expect, it } from 'vitest';
import { DataSourceItemSchema } from '../configSchema';

const base = { url: 'https://example.com/index.tif', format: 'cog', zIndex: 0 };

const stops = [
  { value: -0.4, color: '#112233' },
  { value: 0.6, color: '#AABBCC' },
];

describe('spectralIndex.legendStops label field', () => {
  it('normalises legacy meaning stops to label', () => {
    const parsed = DataSourceItemSchema.parse({
      ...base,
      spectralIndex: {
        recipe: 'ndvi', bandA: 8, bandB: 4, colormap: 'viridis', min: -1, max: 1,
        paletteMode: 'custom',
        legendStops: [
          { value: -0.4, color: '#112233', meaning: 'Low' },
          { value: 0.6, color: '#AABBCC', meaning: 'High' },
        ],
      },
    });
    expect(parsed.spectralIndex?.legendStops).toEqual([
      { value: -0.4, color: '#112233', label: 'Low' },
      { value: 0.6, color: '#AABBCC', label: 'High' },
    ]);
  });

  it('keeps label stops untouched and re-exports label', () => {
    const parsed = DataSourceItemSchema.parse({
      ...base,
      spectralIndex: {
        recipe: 'ndvi', bandA: 8, bandB: 4, colormap: 'viridis', min: -1, max: 1,
        paletteMode: 'custom',
        legendStops: [
          { value: -0.4, color: '#112233', label: 'Low' },
          { value: 0.6, color: '#AABBCC', label: 'High' },
        ],
      },
    });
    expect(parsed.spectralIndex?.legendStops).toEqual([
      { value: -0.4, color: '#112233', label: 'Low' },
      { value: 0.6, color: '#AABBCC', label: 'High' },
    ]);
  });

  it('rejects stops with an empty or missing label', () => {
    for (const legendStops of [
      stops.map((s) => ({ ...s, label: '' })),
      stops,
      stops.map((s) => ({ ...s, meaning: '' })),
    ]) {
      const result = DataSourceItemSchema.safeParse({
        ...base,
        spectralIndex: {
          recipe: 'ndvi', bandA: 8, bandB: 4, colormap: 'viridis', min: -1, max: 1,
          paletteMode: 'custom', legendStops,
        },
      });
      expect(result.success).toBe(false);
    }
  });
});
