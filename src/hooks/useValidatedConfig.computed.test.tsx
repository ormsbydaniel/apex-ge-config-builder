import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useValidatedConfig } from './useValidatedConfig';
import { applyExportTransformations } from '@/utils/exportTransformations';
import { buildComputedStyle, type ComputedCompositeConfig } from '@/utils/rgbComposite/computed';
const cfg: ComputedCompositeConfig = { recipe: 'barren-soil', bands: [1, 3, 7, 9], inputScale: 'dn', noData: 0 };
vi.mock('@/contexts/ConfigContext', () => ({ useConfig: () => ({ dispatch: vi.fn(), config: {
  version: '1', services: [], sources: [{ id: 'test', name: 'Test', data: [{ url: 'https://example.org/a.tif', format: 'cog', zIndex: 1, computedComposite: cfg, bands: cfg.bands, normalize: false, style: buildComputedStyle(cfg) }] }],
} }) }));
describe('computed config persistence', () => {
  it('preserves metadata and GPU style from context through validation and export', () => {
    const { result } = renderHook(useValidatedConfig);
    const item = result.current.config.sources[0].data[0];
    expect(item.computedComposite).toEqual(cfg);
    expect(item.style).toEqual(buildComputedStyle(cfg));
    const exported = applyExportTransformations(result.current.config, { sortToMatchUiOrder: true });
    expect(JSON.parse(JSON.stringify(exported)).sources[0].data[0]).toMatchObject({ computedComposite: cfg, normalize: false, bands: cfg.bands });
  });
});