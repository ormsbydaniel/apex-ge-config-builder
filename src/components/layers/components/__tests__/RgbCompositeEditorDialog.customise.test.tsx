import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RgbCompositeEditorDialog } from '../RgbCompositeEditorDialog';
import type { DataSource } from '@/types/config';
import type { DataSourceItem } from '@/types/dataSource';

// jsdom lacks ResizeObserver, which Radix Select/ScrollArea need.
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ??= ResizeObserverStub;

vi.mock('@/utils/cogMetadata', () => ({
  fetchCogHeaderMetadata: vi.fn().mockResolvedValue({ samplesPerPixel: 10, noDataValue: 0 }),
}));

vi.mock('@/utils/rgbComposite/histogramCache', () => ({
  getHistogram: vi.fn().mockResolvedValue(null),
  peekStretch: vi.fn(() => null),
}));

const savedItem = {
  format: 'cog',
  url: 'https://example.com/scene.tif',
  spectralIndex: {
    recipe: 'ndvi',
    bandA: 8,
    bandB: 4,
    colormap: 'greens',
    reverse: false,
    min: -0.5,
    max: 0.5,
    paletteMode: 'recipe',
  },
} as unknown as DataSourceItem;

const source = { name: 'Test layer', data: [savedItem] } as unknown as DataSource;

async function openEditor(onUpdate: ReturnType<typeof vi.fn>) {
  render(
    <RgbCompositeEditorDialog
      open
      onOpenChange={vi.fn()}
      source={source}
      onUpdateDataSources={onUpdate}
    />,
  );
  await waitFor(() => expect(screen.getByText('Customise settings')).toBeTruthy());
}

describe('RgbCompositeEditorDialog customise settings', () => {
  it('shows the stop editor directly when the section is expanded', async () => {
    await openEditor(vi.fn());

    expect(screen.queryByText('Customise colour stops')).toBeNull();
    fireEvent.click(screen.getByText('Customise settings'));

    expect(await screen.findByLabelText('Stop 1 value')).toBeTruthy();
    expect(screen.getByLabelText('Stop 1 legend meaning')).toBeTruthy();
    expect(screen.getByLabelText('Named colour ramp')).toBeTruthy();
    expect(screen.queryByText('Customise colour stops')).toBeNull();
  });

  it('keeps recipe mode when saved without edits', async () => {
    const onUpdate = vi.fn();
    await openEditor(onUpdate);

    fireEvent.click(screen.getByText('Customise settings'));
    await screen.findByLabelText('Stop 1 value');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const saved = onUpdate.mock.calls[0][0][0].spectralIndex;
    expect(saved.paletteMode).toBe('recipe');
  });

  it('switches to a custom palette on the first stop edit and saves the stops', async () => {
    const onUpdate = vi.fn();
    await openEditor(onUpdate);

    fireEvent.click(screen.getByText('Customise settings'));
    fireEvent.change(await screen.findByLabelText('Stop 1 value'), { target: { value: '-0.25' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const saved = onUpdate.mock.calls[0][0][0].spectralIndex;
    expect(saved.paletteMode).toBe('custom');
    expect(saved.legendStops[0].value).toBe(-0.25);
  });
});
