import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataSourceItem from '../DataSourceItem';
import { DataSourceItem as DataSourceItemType } from '@/types/config';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/cogMetadata', () => ({
  fetchCogHeaderMetadata: vi.fn().mockResolvedValue({ samplesPerPixel: 1 }),
}));

const baseSource: DataSourceItemType = {
  url: 'https://example.com/stac/collection/items',
  format: 'stac',
} as DataSourceItemType;

describe('DataSourceItem asset badges', () => {
  it('renders the asset and mapped format in the right-hand metadata group', () => {
    render(<DataSourceItem dataSource={{ ...baseSource, assets: ['data'], assetFormats: { data: 'cog' } }} index={0} onRemove={() => {}} />);
    const metadata = screen.getByLabelText('Dataset metadata');
    const badge = screen.getByText('data (cog)');
    expect(metadata).toContainElement(badge);
    expect(badge.closest('[class]')).toHaveClass('bg-asset-badge', 'text-asset-badge-foreground', 'border-asset-badge-border');
  });

  it('renders one badge per asset in order for multiple assets', () => {
    render(
      <DataSourceItem
        dataSource={{ ...baseSource, assets: ['visual', 'data'], assetFormats: { visual: 'cog', data: 'flatgeobuf' } }}
        index={0}
        onRemove={() => {}}
      />
    );
    const metadata = screen.getByLabelText('Dataset metadata');
    const badges = Array.from(metadata.querySelectorAll('.bg-asset-badge')).map((element) => element.textContent);
    expect(badges).toEqual(['visual (cog)', 'data (flatgeobuf)']);
  });

  it('falls back to the asset name when an older config has no mapped format', () => {
    render(<DataSourceItem dataSource={{ ...baseSource, assets: ['data'] }} index={0} onRemove={() => {}} />);
    expect(screen.getByLabelText('Dataset metadata')).toContainElement(screen.getByText('data'));
  });

  it('renders no asset badge for a STAC source without assets', () => {
    render(<DataSourceItem dataSource={{ ...baseSource }} index={0} onRemove={() => {}} />);
    expect(screen.queryByText('data')).not.toBeInTheDocument();
  });

  it('renders no asset badge for a non-STAC source', () => {
    render(
      <DataSourceItem
        dataSource={{ url: 'https://example.com/data.fgb', format: 'flatgeobuf', assets: ['data'] } as unknown as DataSourceItemType}
        index={0}
        onRemove={() => {}}
      />
    );
    expect(screen.queryByText('data')).not.toBeInTheDocument();
  });
});
