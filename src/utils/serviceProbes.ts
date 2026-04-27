import { DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { fetchStacCapabilities } from '@/utils/stacCapabilities';
import { fetchS3BucketContents } from '@/utils/s3Utils';

export type ProbeKind = 'stac' | 'ogc' | 's3';

export interface ProbeResult {
  ok: boolean;
  message: string;
}

/**
 * Single-service reachability probe. Mirrors the per-kind logic used by
 * useBulkServiceValidation so the modal's "Validate" button matches the
 * post-save card badge behaviour exactly.
 */
export async function validateSingleService(
  url: string,
  kind: ProbeKind,
  ogcFormat?: DataSourceFormat,
): Promise<ProbeResult> {
  if (!url || !url.trim()) {
    return { ok: false, message: 'URL is empty' };
  }

  try {
    if (kind === 'stac') {
      const { capabilities, title } = await fetchStacCapabilities(url);
      if (capabilities) {
        const count = capabilities.layers?.length ?? 0;
        const titlePart = title ? `${title} — ` : '';
        return {
          ok: true,
          message: `${titlePart}${count} ${count === 1 ? 'collection' : 'collections'} available`,
        };
      }
      return { ok: false, message: "Couldn't fetch STAC catalogue" };
    }

    if (kind === 'ogc') {
      if (!ogcFormat) return { ok: false, message: 'Missing service format' };
      const capabilities = await fetchServiceCapabilities(url, ogcFormat);
      if (capabilities) {
        const count = capabilities.layers?.length ?? 0;
        return {
          ok: true,
          message: `${count} ${count === 1 ? 'layer' : 'layers'} available`,
        };
      }
      return { ok: false, message: "Couldn't fetch capabilities" };
    }

    if (kind === 's3') {
      // Try a full bucket listing first; fall back to HEAD reachability.
      try {
        const objects = await fetchS3BucketContents(url);
        return {
          ok: true,
          message: `Bucket reachable — ${objects.length} ${objects.length === 1 ? 'object' : 'objects'} listed`,
        };
      } catch {
        // fall through
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        if (res.ok || res.status === 403) {
          return { ok: true, message: 'Endpoint reachable (listing not permitted)' };
        }
        return { ok: false, message: `Endpoint returned HTTP ${res.status}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { ok: false, message: `Couldn't reach endpoint — ${msg}` };
      } finally {
        clearTimeout(timer);
      }
    }

    return { ok: false, message: 'Unsupported service type' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, message: msg };
  }
}
