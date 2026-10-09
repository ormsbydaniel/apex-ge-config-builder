import { describe, it, expect } from 'vitest';
import {
  DISPLAY_NAME_MAX_LENGTH,
  extractDisplayName,
  extractStacDisplayName,
  truncateDisplayName,
} from '../urlDisplay';

const longId = 'S2A_30VUS_20260412T105321Z04_mosaic_0001_ard_scene_aVeryLongSentinelSceneIdentifierSegment';

describe('truncateDisplayName', () => {
  it('leaves short names unchanged', () => {
    expect(truncateDisplayName('scene_0042.tif')).toBe('scene_0042.tif');
  });

  it('truncates long names at the cap with an ellipsis', () => {
    const result = truncateDisplayName(longId);
    expect(result).toBe(`${longId.slice(0, DISPLAY_NAME_MAX_LENGTH)}…`);
    expect(result).toHaveLength(DISPLAY_NAME_MAX_LENGTH + 1);
  });
});

describe('extractStacDisplayName', () => {
  it('shows the collection name for an items list endpoint without query', () => {
    expect(extractStacDisplayName('https://stac.example.com/collections/sentinel2_ard/items')).toBe(
      'sentinel2_ard/items'
    );
  });

  it('shows the collection name for an items list endpoint with query parameters', () => {
    expect(
      extractStacDisplayName('https://stac.example.com/collections/sentinel2_ard/items?limit=20&bbox=1,2,3,4')
    ).toBe('sentinel2_ard/items');
  });

  it('truncates a very long single-item ID with an ellipsis', () => {
    const url = `https://stac.example.com/collections/sentinel2_ard/items/${longId}`;
    expect(extractStacDisplayName(url)).toBe(`${longId.slice(0, DISPLAY_NAME_MAX_LENGTH)}…`);
  });

  it('shows the full item ID when it fits within the cap', () => {
    expect(extractStacDisplayName('https://stac.example.com/collections/c/items/S2_scene_0042')).toBe(
      'S2_scene_0042'
    );
  });

  it('returns the full untruncated item ID when truncate is false', () => {
    const url = `https://stac.example.com/collections/c/items/${longId}`;
    expect(extractStacDisplayName(url, false)).toBe(longId);
  });

  it('falls back to the last segment for an item not under /collections', () => {
    expect(extractStacDisplayName('https://stac.example.com/items/scene_0042')).toBe('scene_0042');
  });

  it('falls back to the generic behaviour for collection URLs', () => {
    expect(extractStacDisplayName('https://stac.example.com/collections/sentinel2_ard')).toBe('sentinel2_ard');
  });

  it('falls back to the generic behaviour for unparseable URLs', () => {
    expect(extractStacDisplayName('not-a-url')).toBe('not-a-url');
  });

  it('returns empty for an empty URL', () => {
    expect(extractStacDisplayName('')).toBe('');
  });
});

describe('extractDisplayName truncation', () => {
  it('truncates a long COG filename at the cap', () => {
    const url = `https://data.example.com/imagery/${longId}.tif`;
    const result = extractDisplayName(url, 'cog');
    expect(result).toBe(`${longId.slice(0, DISPLAY_NAME_MAX_LENGTH)}…`);
  });

  it('leaves a short COG filename unchanged', () => {
    expect(extractDisplayName('https://data.example.com/imagery/scene_0042.tif', 'cog')).toBe('scene_0042.tif');
  });

  it('truncates a long vector filename', () => {
    const url = `https://data.example.com/vectors/${longId}.fgb`;
    expect(extractDisplayName(url, 'flatgeobuf')).toBe(`${longId.slice(0, DISPLAY_NAME_MAX_LENGTH)}…`);
  });

  it('truncates a long default-case filename', () => {
    const url = `https://data.example.com/files/${longId}.bin`;
    expect(extractDisplayName(url, 'stac')).toBe(`${longId.slice(0, DISPLAY_NAME_MAX_LENGTH)}…`);
  });

  it('returns the full name when truncate is false', () => {
    const url = `https://data.example.com/imagery/${longId}.tif`;
    expect(extractDisplayName(url, 'cog', false)).toBe(`${longId}.tif`);
  });
});
