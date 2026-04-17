import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLayerCardFormSubmission } from '../useLayerCardFormSubmission';
import { DataSource } from '@/types/config';

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

/**
 * Creates a minimal valid form data object for submission.
 * Override specific fields as needed per test.
 */
const createBaseFormData = (overrides = {}) => ({
  name: 'Test Layer',
  description: 'A test layer',
  interfaceGroup: 'group1',
  subinterfaceGroup: '',
  attributionText: 'Test attribution',
  attributionUrl: '',
  hasFeatureStatistics: false,
  isActive: true,
  exclusivitySets: [],
  units: '',
  contentLocation: 'layerCard' as const,
  toggleable: true,
  opacitySlider: true,
  zoomToCenter: true,
  download: undefined,
  temporalControls: false,
  constraintSlider: false,
  blendControls: false,
  legendType: 'swatch' as const,
  legendUrl: '',
  startColor: '#000000',
  endColor: '#ffffff',
  minValue: '0',
  maxValue: '100',
  categories: [],
  colormaps: [],
  timeframe: 'None' as const,
  fields: {},
  ...overrides,
});

/**
 * Creates a fully-populated editing layer with all possible properties
 * to verify nothing is lost during form submission.
 */
const createFullEditingLayer = (): DataSource => ({
  name: 'Existing Layer',
  isActive: true,
  data: [
    { url: 'https://example.com/data.tif', format: 'cog' },
    { url: 'https://example.com/data2.tif', format: 'cog' },
  ],
  statistics: [
    { url: 'https://example.com/stats.csv', format: 'csv' },
  ],
  constraints: [
    { url: 'https://example.com/constraint.tif', format: 'cog', bandIndex: 2 },
  ],
  workflows: [
    { name: 'workflow1', type: 'analysis', steps: [] },
  ] as any,
  charts: [
    {
      title: 'Test Chart',
      type: 'scatter',
      sources: [{ url: 'https://example.com/chart.csv' }],
      traces: [],
    },
  ] as any,
  hasFeatureStatistics: true,
  meta: {
    description: 'Existing description',
    attribution: { text: 'Existing attribution', url: 'https://example.com' },
    swipeConfig: {
      clippedSourceName: 'source1',
      baseSourceNames: ['source2'],
    },
  },
  layout: {
    interfaceGroup: 'group1',
    contentLocation: 'layerCard',
    layerCard: {
      toggleable: true,
      showStatistics: true,
      legend: { type: 'swatch' },
      controls: { opacitySlider: true, zoomToCenter: true },
    },
  },
} as any);

describe('useLayerCardFormSubmission', () => {
  describe('preserves all DataSource properties when editing', () => {
    it('preserves data array', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.data).toEqual(editingLayer.data);
    });

    it('preserves statistics array', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.statistics).toEqual(editingLayer.statistics);
    });

    it('preserves constraints array', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.constraints).toEqual(editingLayer.constraints);
    });

    it('preserves workflows array', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.workflows).toEqual(editingLayer.workflows);
    });

    it('preserves charts array', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.charts).toEqual(editingLayer.charts);
    });

    it('preserves meta.swipeConfig', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.meta?.swipeConfig).toEqual(editingLayer.meta?.swipeConfig);
    });

    it('preserves layout.layerCard.showStatistics (layerCard content)', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(
        createBaseFormData({ contentLocation: 'layerCard' })
      );
      expect(output.layout?.layerCard?.showStatistics).toBe(true);
    });

    it('preserves layout.layerCard.showStatistics (infoPanel content)', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(
        createBaseFormData({ contentLocation: 'infoPanel' })
      );
      expect(output.layout?.layerCard?.showStatistics).toBe(true);
    });

    it('preserves preview for base layers', () => {
      const editingLayer = {
        ...createFullEditingLayer(),
        isBaseLayer: true,
        preview: 'https://example.com/preview.png',
      } as any;

      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect((output as any).preview).toBe('https://example.com/preview.png');
    });
  });

  describe('does not carry over properties from absent editingLayer', () => {
    it('returns empty data array when no editingLayer', () => {
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(undefined, false)
      );

      const output = result.current.createLayerFromFormData(createBaseFormData());
      expect(output.data).toEqual([]);
      expect(output.statistics).toBeUndefined();
      expect(output.constraints).toBeUndefined();
      expect(output.workflows).toBeUndefined();
      expect(output.charts).toBeUndefined();
      expect(output.meta?.swipeConfig).toBeUndefined();
      expect((output as any).preview).toBeUndefined();
    });
  });

  describe('form data is correctly applied', () => {
    it('applies name and isActive from form data', () => {
      const editingLayer = createFullEditingLayer();
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(editingLayer, true)
      );

      const output = result.current.createLayerFromFormData(
        createBaseFormData({ name: '  New Name  ', isActive: false })
      );
      expect(output.name).toBe('New Name');
      expect(output.isActive).toBe(false);
    });

    it('applies timeframe when not None', () => {
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(undefined, false)
      );

      const output = result.current.createLayerFromFormData(
        createBaseFormData({ timeframe: 'Months', defaultTimestamp: 1234567890 })
      );
      expect(output.timeframe).toBe('Months');
      expect(output.defaultTimestamp).toBe(1234567890);
    });

    it('omits timeframe when None', () => {
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(undefined, false)
      );

      const output = result.current.createLayerFromFormData(
        createBaseFormData({ timeframe: 'None' })
      );
      expect(output.timeframe).toBeUndefined();
    });

    it('applies exclusivitySets when present', () => {
      const { result } = renderHook(() =>
        useLayerCardFormSubmission(undefined, false)
      );

      const output = result.current.createLayerFromFormData(
        createBaseFormData({ exclusivitySets: ['set1', 'set2'] })
      );
      expect(output.exclusivitySets).toEqual(['set1', 'set2']);
    });
  });
});
