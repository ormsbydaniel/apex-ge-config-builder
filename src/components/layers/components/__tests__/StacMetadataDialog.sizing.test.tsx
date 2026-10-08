import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StacMetadataDialog from '../StacMetadataDialog';

vi.mock('../CogMetadataDialog', () => ({ default: () => null }));
vi.mock('../FlatGeobufMetadataDialog', () => ({ default: () => null }));

vi.mock('@/utils/stacAssetFormat', () => ({
  getEffectiveFormat: vi.fn(() => 'cog'),
  resolveDataSourceInspectionAccess: vi.fn().mockResolvedValue({ url: 'https://example.com/asset.tif', format: 'cog' }),
}));

vi.mock('@/utils/stacMetadata', () => ({
  getStacCollectionUrl: vi.fn(() => 'https://example.com/stac/collections/tillage'),
  fetchStacCollection: vi.fn().mockResolvedValue({ id: 'tillage', title: 'Tillage', description: 'A collection' }),
  fetchStacItemSample: vi.fn().mockResolvedValue({
    single: false,
    returned: 3,
    matched: 12,
    item: { id: 'item-1', properties: { datetime: '2026-01-01T00:00:00Z' }, bbox: [0, 0, 1, 1], assets: { data: { title: 'Data asset', href: 'https://example.com/asset.tif?sig=secret' } } },
  }),
  stripUrlParams: vi.fn((href: string) => href.split('?')[0]),
}));

const dataSource = {
  url: 'https://example.com/stac/collections/tillage/items',
  format: 'stac',
  assets: ['data'],
  assetFormats: { data: 'cog' },
} as const;

const FIXED_PANEL_CLASSES = ['w-full', 'max-w-2xl', 'h-[80vh]', 'overflow-hidden', 'flex', 'flex-col'];
const SCROLL_CLASSES = ['h-full', 'min-h-0', 'overflow-y-auto'];

const getPanel = () => screen.getByRole('dialog');
const getActiveTabContent = () => screen.getByRole('tabpanel');

describe('StacMetadataDialog sizing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens at a fixed size with only the tab body scrolling', () => {
    render(<StacMetadataDialog dataSource={dataSource} open onOpenChange={() => {}} />);

    const panel = getPanel();
    FIXED_PANEL_CLASSES.forEach((cls) => expect(panel).toHaveClass(cls));
    expect(panel).not.toHaveClass('max-h-[85vh]');

    const content = getActiveTabContent();
    SCROLL_CLASSES.forEach((cls) => expect(content).toHaveClass(cls));
  });

  it('keeps the same fixed size when switching tabs', () => {
    render(<StacMetadataDialog dataSource={dataSource} open onOpenChange={() => {}} />);

    const sizeBefore = getPanel().className;
    fireEvent.click(screen.getByRole('tab', { name: 'Collection' }));

    expect(getPanel().className).toBe(sizeBefore);
    FIXED_PANEL_CLASSES.forEach((cls) => expect(getPanel()).toHaveClass(cls));

    const content = getActiveTabContent();
    SCROLL_CLASSES.forEach((cls) => expect(content).toHaveClass(cls));
  });

  it('does not let the tab strip shrink away', () => {
    render(<StacMetadataDialog dataSource={dataSource} open onOpenChange={() => {}} />);
    expect(screen.getByRole('tablist')).toHaveClass('shrink-0');
  });
});
