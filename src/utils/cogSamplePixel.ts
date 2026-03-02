import { fromUrl } from 'geotiff';

export interface SamplePixelResult {
  bandValues: number[];
  bandCount: number;
  source: string; // 'center' or description
}

/**
 * Fetch a single pixel's band values from the center of a COG file.
 * Uses the smallest available overview for efficiency.
 * Returns one value per band (samplesPerPixel).
 *
 * Timeout: 10 seconds with AbortController for physical request cancellation.
 */
export async function fetchCogCenterPixel(url: string): Promise<SamplePixelResult> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10000);

  try {
    const tiff = await fromUrl(url, { signal: abortController.signal } as any);

    // Find the smallest overview (last IFD before we run out)
    let bestImage = await tiff.getImage(0);
    let ifdIndex = 1;
    const maxIfd = 20;

    try {
      while (ifdIndex < maxIfd) {
        const img = await tiff.getImage(ifdIndex);
        if (img.getWidth() < bestImage.getWidth()) {
          bestImage = img;
        }
        ifdIndex++;
      }
    } catch {
      // End of IFDs
    }

    const width = bestImage.getWidth();
    const height = bestImage.getHeight();
    const samplesPerPixel = bestImage.fileDirectory.SamplesPerPixel || 1;

    // Read a 1x1 window from the center
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);

    const rasters = await bestImage.readRasters({
      window: [cx, cy, cx + 1, cy + 1],
      // Read all bands
    });

    const bandValues: number[] = [];
    for (let b = 0; b < samplesPerPixel; b++) {
      const band = rasters[b] as any;
      bandValues.push(band?.[0] ?? 0);
    }

    return {
      bandValues,
      bandCount: samplesPerPixel,
      source: 'center',
    };
  } catch (err) {
    if (abortController.signal.aborted) {
      throw new Error('Sample pixel fetch timed out (10s)');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
