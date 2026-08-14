import { describe, it, expect } from 'vitest';
import {
  legendToStyleSuggestion,
  legendToCategories,
  layerStyleSuggestion,
  describeStyleSuggestion,
  describeBandMetadata,
  describeRangeMismatch,
  suppressedLegendStyle,
} from '@/utils/catalogueLegend';
import { generateColorRamp } from '@/utils/colormapUtils';
import { CatalogueLegend } from '@/types/service';

const toHex = (c: [number, number, number]) =>
  `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;

describe('catalogueLegend', () => {
  it('converts a discrete legend to categories', () => {
    const legend: CatalogueLegend = {
      type: 'discrete',
      entries: [
        { value: 0, color: '#EDF8FB' },
        { value: 1, color: '#B3CDE3' },
        { value: 2, color: '#8C96C6', label: 'Cloud' },
      ],
    };
    const suggestion = legendToStyleSuggestion(legend);
    expect(suggestion?.kind).toBe('categories');
    expect(legendToCategories(legend)).toEqual([
      { value: 0, color: '#EDF8FB', label: '0' },
      { value: 1, color: '#B3CDE3', label: '1' },
      { value: 2, color: '#8C96C6', label: 'Cloud' },
    ]);
  });

  it('uses the colormapName hint for continuous legends', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 1,
      steps: 10,
      colormapName: 'magma',
      reverse: true,
      units: 'fraction',
      entries: [
        { value: 0, color: '#FCFDBF' },
        { value: 0.5, color: '#F1605D' },
        { value: 1, color: '#000004' },
      ],
    });
    expect(suggestion).toMatchObject({
      kind: 'colormap',
      units: 'fraction',
      colormap: { name: 'magma', min: 0, max: 1, steps: 10, reverse: true },
    });
  });

  it('matches an unnamed preset ramp by colour', () => {
    const ramp = generateColorRamp('viridis', 12, false);
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 100,
      entries: ramp.map((c, i) => ({ value: (i / 11) * 100, color: toHex(c) })),
    });
    expect(suggestion).toMatchObject({ kind: 'colormap', matched: true });
  });

  it('falls back to a two-stop gradient for bespoke ramps', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 5,
      entries: [
        { value: 0, color: '#123456' },
        { value: 2.5, color: '#654321' },
        { value: 5, color: '#0abc99' },
      ],
    });
    expect(suggestion).toMatchObject({
      kind: 'gradient',
      min: 0,
      max: 5,
      startColor: '#123456',
      endColor: '#0ABC99',
    });
  });

  it('excludes no-data sentinels from the ramp', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 1,
      noData: [{ value: -1, color: '#FFFFFF' }],
      entries: [
        { value: -1, color: '#FFFFFF' },
        { value: 0, color: '#123456' },
        { value: 1, color: '#0ABC99' },
      ],
    });
    expect(suggestion).toMatchObject({ kind: 'gradient', startColor: '#123456' });
  });
});

describe('catalogue layer band metadata', () => {
  it('keeps official class labels and reports partial coverage', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'discrete',
      officialLabelCount: 2,
      labelSource: { title: 'Product User Manual', url: 'https://example.org/pum' },
      entries: [
        { value: 0, color: '#282828', label: 'Unknown' },
        { value: 20, color: '#FFBB22', label: 'Shrubs' },
        { value: 30, color: '#FFFF4C' },
      ],
    });
    expect(suggestion).toMatchObject({ kind: 'categories', labelledCount: 2 });
    expect(describeStyleSuggestion(suggestion!)).toBe('Categories: 3 classes (2 labelled)');
  });

  it('falls back to the layer units when the legend has none', () => {
    const suggestion = layerStyleSuggestion({
      identifier: 'A_ET_ENSEMBLE',
      units: 'mm/day',
      styles: [
        {
          name: 'et.js',
          legend: {
            type: 'continuous',
            min: 0,
            max: 10,
            entries: [
              { value: 0, color: '#123456' },
              { value: 5, color: '#654321' },
              { value: 10, color: '#0ABC99' },
            ],
          },
        },
      ],
    });
    expect(suggestion?.units).toBe('mm/day');
  });

  it('summarises band metadata and flags a narrower legend range', () => {
    const layer = {
      identifier: 'A_ET_ENSEMBLE',
      units: 'mm/day',
      sourceFormat: 'INT16',
      scale: 0.1,
      offset: 0,
      dataRange: { min: 0, max: 20 },
      styles: [
        {
          name: 'et.js',
          legend: {
            type: 'continuous' as const,
            min: 0,
            max: 10,
            entries: [
              { value: 0, color: '#123456' },
              { value: 10, color: '#0ABC99' },
            ],
          },
        },
      ],
    };
    expect(describeBandMetadata(layer)).toBe('INT16 · scale 0.1 · range 0–20 mm/day');
    expect(describeRangeMismatch(layer, layerStyleSuggestion(layer))).toBe(
      'Legend shows 0–10 of a 0–20 mm/day data range',
    );
  });

  it('reports a suppressed legend instead of a suggestion', () => {
    const layer = {
      identifier: 'LST',
      styles: [
        {
          name: 'lst.js',
          evalscriptUrl: 'https://example.org/lst.js',
          legendDiscovery: { status: 'suppressed', reason: 'parsed_evalscript_range_implausibly_narrow' },
        },
      ],
    };
    expect(layerStyleSuggestion(layer)).toBeNull();
    expect(suppressedLegendStyle(layer)?.name).toBe('lst.js');
  });

  describe('official legend graphics', () => {
    const dataset = {
      datasetIdentifier: 'lst_global_5km_hourly_v1',
      title: 'LST',
      theme: 'Energy',
      available: true,
      style: {
        legendImage: {
          source: 'official-clms-cdse-legend',
          pageUrl: 'https://land.copernicus.eu/en/cdse-legends/lst.png',
          imageUrl: 'https://land.copernicus.eu/en/cdse-legends/lst.png/@@images/image.png',
        },
      },
    };

    it('uses the graphic when the layer has no legend', () => {
      const suggestion = layerStyleSuggestion(
        { identifier: 'LST', units: 'K' },
        dataset,
      );
      expect(suggestion).toEqual({
        kind: 'legendImage',
        url: dataset.style.legendImage.imageUrl,
        pageUrl: dataset.style.legendImage.pageUrl,
        units: 'K',
      });
      expect(describeStyleSuggestion(suggestion!)).toBe('Official legend graphic');
    });

    it('uses the graphic when the legend was suppressed', () => {
      const layer = {
        identifier: 'LST',
        styles: [{ name: 'lst.js', legendDiscovery: { status: 'suppressed' } }],
      };
      expect(layerStyleSuggestion(layer, dataset)?.kind).toBe('legendImage');
    });

    it('uses the graphic in place of a two-stop gradient fallback', () => {
      const layer = {
        identifier: 'X',
        styles: [
          {
            name: 'x.js',
            legend: {
              type: 'continuous' as const,
              min: 0,
              max: 10,
              entries: [
                { value: 0, color: '#123456' },
                { value: 10, color: '#0ABC99' },
              ],
            },
          },
        ],
      };
      expect(layerStyleSuggestion(layer)?.kind).toBe('gradient');
      expect(layerStyleSuggestion(layer, dataset)?.kind).toBe('legendImage');
    });

    it('keeps a resolved colormap in preference to the graphic', () => {
      const colors = generateColorRamp('viridis', 8, false);
      const layer = {
        identifier: 'NDVI',
        styles: [
          {
            name: 'ndvi.js',
            legend: {
              type: 'continuous' as const,
              min: 0,
              max: 1,
              colormapName: 'viridis',
              entries: colors.map((c, i) => ({ value: i / 7, color: toHex(c) })),
            },
          },
        ],
      };
      expect(layerStyleSuggestion(layer, dataset)?.kind).toBe('colormap');
    });

    it('keeps categories in preference to the graphic', () => {
      const layer = {
        identifier: 'WB',
        styles: [
          {
            name: 'wb.js',
            legend: {
              type: 'discrete' as const,
              entries: [
                { value: 0, color: '#000000' },
                { value: 1, color: '#0000FF' },
              ],
            },
          },
        ],
      };
      expect(layerStyleSuggestion(layer, dataset)?.kind).toBe('categories');
    });
  });
});
