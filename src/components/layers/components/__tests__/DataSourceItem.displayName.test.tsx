import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataSourceItem from '../DataSourceItem';
import { DataSourceItem as DataSourceItemType } from '@/types/config';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/cogMetadata', () => ({
  fetchCogHeaderMetadata: vi.fn().mockResolvedValue({ samplesPerPixel: 1 }),
}));

const longId = 'S2A_30VUS_20260412T105321Z04_mosaic_0001_ard_scene_aVeryLongSentinelSceneIdentifierSegment';

describe('DataSourceItem display names', () => {
  it('truncates a long single-item STAC name and shows the full ID in the tooltip', async () => {
    const user = userEvent.setup();
    render(
      <DataSourceItem
        dataSource={{ url: `https://stac.example.com/collections/sentinel2_ard/items/${longId}`, format: 'stac' } as DataSourceItemType}
        index={0}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText(`${longId.slice(0, 80)}…`)).toBeInTheDocument();

    await user.hover(screen.getByText(`${longId.slice(0, 80)}…`));
    expect((await screen.findAllByText(`https://stac.example.com/collections/sentinel2_ard/items/${longId}`)).length).toBeGreaterThan(0);
  });

  it('shows the collection name for an items list endpoint', () => {
    render(
      <DataSourceItem
        dataSource={{ url: 'https://stac.example.com/collections/sentinel2_ard/items?limit=20', format: 'stac' } as DataSourceItemType}
        index={0}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText('sentinel2_ard/items')).toBeInTheDocument();
  });

  it('truncates a long COG filename', () => {
    render(
      <DataSourceItem
        dataSource={{ url: `https://data.example.com/imagery/${longId}.tif`, format: 'cog' } as DataSourceItemType}
        index={0}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText(`${longId.slice(0, 80)}…`)).toBeInTheDocument();
  });
});
