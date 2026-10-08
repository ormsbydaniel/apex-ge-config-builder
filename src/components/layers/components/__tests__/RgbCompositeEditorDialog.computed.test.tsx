import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RgbCompositeEditorDialog } from '../RgbCompositeEditorDialog';
import type { DataSource } from '@/types/config';
import { getHistogram } from '@/utils/rgbComposite/histogramCache';
import { fetchCogHeaderMetadata } from '@/utils/cogMetadata';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ??= ResizeObserverStub;
vi.mock('@/utils/cogMetadata', () => ({ fetchCogHeaderMetadata: vi.fn().mockResolvedValue({ samplesPerPixel: 10, noDataValue: 0 }) }));
vi.mock('@/utils/rgbComposite/histogramCache', () => ({ getHistogram: vi.fn(), peekStretch: vi.fn() }));
vi.mock('@/utils/stacAssetFormat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/stacAssetFormat')>();
  return {
    ...actual,
    resolveDataSourceInspectionAccess: vi.fn(async (item) => item.format === 'stac'
      ? { format: 'cog', url: 'https://assets.example.org/visual.tif?signature=session-only' }
      : { format: item.format, url: item.url }),
  };
});
const computed = { recipe: 'barren-soil' as const, bands: [1, 3, 7, 9], inputScale: 'dn' as const };

describe('computed composite editor', () => {
  it('reopens and saves a single dataset without requesting histograms', async () => {
    const update = vi.fn();
    const source = { name: 'Bristol', data: [{ format: 'cog', zIndex: 1, url: 'https://example.org/a.tif', computedComposite: computed }] } as unknown as DataSource;
    render(<RgbCompositeEditorDialog open source={source} onOpenChange={vi.fn()} onUpdateDataSources={update} />);
    await screen.findByRole('combobox', { name: 'Blue input band' });
    expect(screen.queryByRole('combobox', { name: 'Dataset' })).toBeNull();
    expect(screen.queryByText('Contrast stretch (all bands)')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(update.mock.calls[0][0][0]).toMatchObject({ computedComposite: { ...computed, noData: 0 }, normalize: false, bands: [1, 3, 7, 9] });
    expect(getHistogram).not.toHaveBeenCalled();
  });
  it('dataset navigation switches to the matching index editor and back', async () => {
    const source = { name: 'East London', data: [
      { format: 'cog', zIndex: 1, url: 'https://example.org/a.tif', computedComposite: computed },
      { format: 'cog', zIndex: 1, url: 'https://example.org/b.tif', spectralIndex: { recipe: 'ndvi', bandA: 7, bandB: 3, colormap: 'greens', min: -1, max: 1, paletteMode: 'recipe' } },
    ] } as unknown as DataSource;
    render(<RgbCompositeEditorDialog open source={source} onOpenChange={vi.fn()} onUpdateDataSources={vi.fn()} />);
    await screen.findByRole('combobox', { name: 'Blue input band' });
    fireEvent.click(screen.getByRole('button', { name: 'Next dataset' }));
    await screen.findByText('Customise settings');
    expect(screen.queryByRole('combobox', { name: 'Blue input band' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Previous dataset' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Blue input band' })).toBeTruthy());
    expect(getHistogram).not.toHaveBeenCalled();
  });

  it('inspects a mapped STAC COG asset but saves styling on the original STAC item', async () => {
    const update = vi.fn();
    const source = { name: 'STAC scene', data: [{
      format: 'stac',
      url: 'https://catalogue.example.org/items?limit=1',
      assets: ['visual'],
      assetFormats: { visual: 'cog' },
      computedComposite: computed,
    }] } as unknown as DataSource;
    render(<RgbCompositeEditorDialog open source={source} onOpenChange={vi.fn()} onUpdateDataSources={update} />);
    await screen.findByRole('combobox', { name: 'Blue input band' });
    await waitFor(() => expect(fetchCogHeaderMetadata).toHaveBeenCalledWith('https://assets.example.org/visual.tif?signature=session-only'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const saved = update.mock.calls[0][0][0];
    expect(saved).toMatchObject({
      format: 'stac',
      url: 'https://catalogue.example.org/items?limit=1',
      assets: ['visual'],
      assetFormats: { visual: 'cog' },
      computedComposite: computed,
    });
    expect(JSON.stringify(saved)).not.toContain('signature=session-only');
  });
});