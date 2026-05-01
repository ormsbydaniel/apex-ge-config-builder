/**
 * Probe a COG URL for performance characteristics that affect rendering speed
 * in the viewer. Issued as a "performance-warning" in the Layer QA flow —
 * never as a hard error. Reachability is the responsibility of the upstream
 * HEAD/GET check.
 *
 * Checks:
 *  1. Tile size out of [256, 512] (or untiled / strip-based)
 *  2. No overviews
 *  3. Inefficient or no compression
 *  4. Pixel-interleaved (BIP) for multi-band imagery — slower than BSQ
 */
import { fetchCogHeaderMetadata } from '@/utils/cogMetadata';

export const COG_TILE_MIN = 256;
export const COG_TILE_MAX = 512;
/** Compressions considered acceptable: LZW, JPEG, Deflate, JPEG2000. */
const COG_EFFICIENT_COMPRESSION = new Set<number>([5, 7, 8, 34712]);

export interface CogPerformanceProbeResult {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  details?: {
    tileWidth?: number;
    tileLength?: number;
    overviewCount?: number;
    compression?: number;
    planarConfiguration?: number;
  };
}

export async function probeCogPerformance(url: string): Promise<CogPerformanceProbeResult> {
  let metadata;
  try {
    metadata = await fetchCogHeaderMetadata(url);
  } catch {
    // Probe failure must not mask the upstream "valid" reachability result.
    return { status: 'ok' };
  }

  const issues: string[] = [];

  // 1. Tile size
  if (!metadata.tileWidth || !metadata.tileLength) {
    issues.push('not tiled (strip-based)');
  } else {
    const tw = metadata.tileWidth;
    const tl = metadata.tileLength;
    const oversized = tw > COG_TILE_MAX || tl > COG_TILE_MAX;
    const undersized = tw < COG_TILE_MIN || tl < COG_TILE_MIN;
    if (oversized || undersized) {
      const dim = tw === tl ? `${tw}` : `${tw}×${tl}`;
      const direction = oversized ? 'too large' : 'too small';
      issues.push(`tile size ${dim} ${direction} (recommended ${COG_TILE_MIN}–${COG_TILE_MAX})`);
    }
  }

  // 2. Overviews
  if (!metadata.overviewCount || metadata.overviewCount === 0) {
    issues.push('no overviews');
  }

  // 3. Compression
  if (metadata.compression === 1) {
    issues.push('uncompressed');
  } else if (metadata.compression !== undefined && !COG_EFFICIENT_COMPRESSION.has(metadata.compression)) {
    issues.push('inefficient compression');
  }

  // 4. Interleave — only meaningful for multi-band imagery.
  // planarConfiguration: 1 (or undefined) = BIP (chunky, slow), 2 = BSQ (fast)
  const samples = metadata.samplesPerPixel ?? 1;
  if (samples > 1 && metadata.planarConfiguration !== 2) {
    issues.push('pixel-interleaved (BIP)');
  }

  if (issues.length === 0) {
    return { status: 'ok' };
  }

  // Capitalise first issue for nicer display.
  const first = issues[0].charAt(0).toUpperCase() + issues[0].slice(1);
  const rest = issues.slice(1);
  const message = [first, ...rest].join('; ');

  return {
    status: 'warning',
    message,
    details: {
      tileWidth: metadata.tileWidth,
      tileLength: metadata.tileLength,
      overviewCount: metadata.overviewCount,
      compression: metadata.compression,
      planarConfiguration: metadata.planarConfiguration,
    },
  };
}
