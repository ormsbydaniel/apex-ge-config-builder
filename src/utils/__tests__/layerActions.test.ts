import { describe, it, expect, vi } from 'vitest';
import { createLayerActionHandlers } from '../layerActions';
import { DataSource } from '@/types/config';

/**
 * Creates a fully-populated layer with all possible properties
 * to verify deep cloning completeness.
 */
const createFullLayer = (): DataSource => ({
  name: 'Original Layer',
  isActive: true,
  hasFeatureStatistics: true,
  exclusivitySets: ['set1', 'set2'],
  timeframe: 'Months',
  defaultTimestamp: 1234567890,
  data: [
    { url: 'https://example.com/data1.tif', format: 'cog', bands: [1, 2, 3] },
    { url: 'https://example.com/data2.tif', format: 'cog' },
  ],
  statistics: [
    { url: 'https://example.com/stats.csv', format: 'csv' },
  ],
  constraints: [
    { url: 'https://example.com/c1.tif', format: 'cog', bandIndex: 2 },
    { url: 'https://example.com/c2.tif', format: 'cog', bandIndex: 3 },
  ],
  workflows: [
    { name: 'workflow1', type: 'analysis', steps: [] },
  ] as any,
  charts: [
    {
      title: 'Test Chart',
      type: 'scatter',
      sources: [{ url: 'https://example.com/chart.csv' }],
      traces: [{ x: 'col1', y: 'col2' }],
    },
  ] as any,
  meta: {
    description: 'Test description',
    attribution: { text: 'Test attribution', url: 'https://example.com' },
    categories: [
      { label: 'Cat1', color: '#ff0000', value: 0 },
      { label: 'Cat2', color: '#00ff00', value: 1 },
    ],
    colormaps: [
      { name: 'viridis', type: 'sequential' },
    ] as any,
    units: 'm/s',
    fields: { field1: { label: 'Field 1' } } as any,
    startColor: '#000000',
    endColor: '#ffffff',
    min: 0,
    max: 100,
    swipeConfig: {
      clippedSourceName: 'source1',
      baseSourceNames: ['source2', 'source3'],
    },
  },
  layout: {
    interfaceGroup: 'group1',
    subinterfaceGroup: 'subgroup1',
    contentLocation: 'layerCard',
    layerCard: {
      toggleable: true,
      showStatistics: true,
      legend: { type: 'gradient' },
      controls: {
        opacitySlider: true,
        zoomToCenter: true,
        temporalControls: false,
        constraintSlider: true,
        blendControls: false,
        download: 'https://example.com/download',
      },
    },
  },
} as any);

describe('handleDuplicateLayer', () => {
  const setupHandlers = (sources: DataSource[]) => {
    const addLayer = vi.fn();
    const updateLayer = vi.fn();
    const setEditingLayerIndex = vi.fn();
    const setSelectedLayerType = vi.fn();
    const setShowLayerForm = vi.fn();

    const handlers = createLayerActionHandlers(
      { sources },
      updateLayer,
      addLayer,
      setEditingLayerIndex,
      setSelectedLayerType,
      setShowLayerForm
    );

    return { handlers, addLayer };
  };

  describe('all properties are present in duplicate', () => {
    it('appends "(Copy)" to the name', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.name).toBe('Original Layer (Copy)');
    });

    it('preserves top-level scalar properties', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.isActive).toBe(original.isActive);
      expect(duplicated.hasFeatureStatistics).toBe(original.hasFeatureStatistics);
      expect(duplicated.timeframe).toBe(original.timeframe);
      expect(duplicated.defaultTimestamp).toBe(original.defaultTimestamp);
    });

    it('preserves exclusivitySets', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.exclusivitySets).toEqual(original.exclusivitySets);
    });

    it('preserves data array', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.data).toEqual(original.data);
    });

    it('preserves statistics array', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.statistics).toEqual(original.statistics);
    });

    it('preserves constraints array', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.constraints).toEqual(original.constraints);
    });

    it('preserves workflows array', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.workflows).toEqual(original.workflows);
    });

    it('preserves charts array', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.charts).toEqual(original.charts);
    });

    it('preserves meta with all fields', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.meta.description).toBe(original.meta.description);
      expect(duplicated.meta.units).toBe(original.meta.units);
      expect(duplicated.meta.startColor).toBe(original.meta.startColor);
      expect(duplicated.meta.endColor).toBe(original.meta.endColor);
      expect(duplicated.meta.min).toBe(original.meta.min);
      expect(duplicated.meta.max).toBe(original.meta.max);
      expect(duplicated.meta.attribution).toEqual(original.meta.attribution);
      expect(duplicated.meta.categories).toEqual(original.meta.categories);
      expect(duplicated.meta.colormaps).toEqual(original.meta.colormaps);
      expect(duplicated.meta.fields).toEqual(original.meta.fields);
      expect(duplicated.meta.swipeConfig).toEqual(original.meta.swipeConfig);
    });

    it('preserves layout with all fields', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      expect(duplicated.layout.interfaceGroup).toBe(original.layout.interfaceGroup);
      expect(duplicated.layout.subinterfaceGroup).toBe(original.layout.subinterfaceGroup);
      expect(duplicated.layout.contentLocation).toBe(original.layout.contentLocation);
      expect(duplicated.layout.layerCard).toEqual(original.layout.layerCard);
    });
  });

  describe('deep clone independence (mutating duplicate does not affect original)', () => {
    it('data array is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.data[0].url = 'MUTATED';
      expect(original.data[0].url).toBe('https://example.com/data1.tif');
    });

    it('statistics array is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.statistics[0].url = 'MUTATED';
      expect(original.statistics[0].url).toBe('https://example.com/stats.csv');
    });

    it('constraints array is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.constraints[0].url = 'MUTATED';
      expect(original.constraints[0].url).toBe('https://example.com/c1.tif');
    });

    it('workflows array is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.workflows[0].name = 'MUTATED';
      expect(original.workflows[0].name).toBe('workflow1');
    });

    it('charts array is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.charts[0].title = 'MUTATED';
      expect(original.charts[0].title).toBe('Test Chart');
    });

    it('meta.attribution is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.meta.attribution.text = 'MUTATED';
      expect(original.meta.attribution.text).toBe('Test attribution');
    });

    it('meta.categories is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.meta.categories[0].label = 'MUTATED';
      expect(original.meta.categories[0].label).toBe('Cat1');
    });

    it('meta.swipeConfig is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.meta.swipeConfig.clippedSourceName = 'MUTATED';
      expect(original.meta.swipeConfig.clippedSourceName).toBe('source1');
    });

    it('layout.layerCard.legend is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.layout.layerCard.legend.type = 'MUTATED';
      expect(original.layout.layerCard.legend.type).toBe('gradient');
    });

    it('layout.layerCard.controls is independent', () => {
      const original = createFullLayer();
      const { handlers, addLayer } = setupHandlers([original]);
      handlers.handleDuplicateLayer(0);

      const duplicated = addLayer.mock.calls[0][0];
      duplicated.layout.layerCard.controls.opacitySlider = false;
      expect(original.layout.layerCard.controls.opacitySlider).toBe(true);
    });
  });
});
