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
  it('renders an asset name badge for a STAC source with one asset', () => {
    render(<DataSourceItem dataSource={{ ...baseSource, assets: ['data'] }} index={0} onRemove={() => {}} />);
    expect(screen.getByText('data')).toBeInTheDocument();
  });

  it('renders one badge per asset in order for multiple assets', () => {
    render(
      <DataSourceItem
        dataSource={{ ...baseSource, assets: ['visual', 'data'], assetFormats: { visual: 'cog', data: 'flatgeobuf' } }}
        index={0}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText('visual')).toBeInTheDocument();
    expect(screen.getByText('data')).toBeInTheDocument();
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
