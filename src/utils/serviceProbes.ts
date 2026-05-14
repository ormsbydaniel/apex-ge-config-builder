import { DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilitiesWithMetrics } from '@/utils/serviceCapabilities';
import { fetchStacCapabilitiesWithMetrics } from '@/utils/stacCapabilities';
import { fetchS3BucketContents } from '@/utils/s3Utils';
import {
  ProbeDiagnostic,
  classifyFetchError,
  classifyHttpResponse,
  classifyInvalidUrl,
  classifyMixedContent,
  formatDiagnostic,
} from '@/utils/serviceDiagnostics';

export type ProbeKind = 'stac' | 'ogc' | 's3';

export interface ProbeResult {
  ok: boolean;
  /** One-line message — preserved for callers that just want a string. */
  message: string;
  /** Structured diagnostic (failure or empty-but-reachable warning). */
  diagnostic?: ProbeDiagnostic;
}

const fail = (diagnostic: ProbeDiagnostic): ProbeResult => ({
  ok: false,
  message: formatDiagnostic(diagnostic),
  diagnostic,
});

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
    return fail({ category: 'invalid-url', title: 'URL is empty' });
  }

  // Up-front URL + transport-security guards — same for every probe kind.
  const invalid = classifyInvalidUrl(url);
  if (invalid) return fail(invalid);
  const mixed = classifyMixedContent(url);
  if (mixed) return fail(mixed);

  try {
    if (kind === 'stac') {
      const { capabilities, title, diagnostic } = await fetchStacCapabilitiesWithMetrics(url);
      if (capabilities) {
        const count = capabilities.layers?.length ?? 0;
        const titlePart = title ? `${title} — ` : '';
        return {
          ok: true,
          message: `${titlePart}${count} ${count === 1 ? 'collection' : 'collections'} available`,
          diagnostic, // 'empty' warning passed through when present
        };
      }
      return fail(diagnostic ?? { category: 'unknown', title: "Couldn't fetch STAC catalogue" });
    }

    if (kind === 'ogc') {
      if (!ogcFormat) {
        return fail({ category: 'unknown', title: 'Missing service format' });
      }
      const { capabilities, diagnostic } = await fetchServiceCapabilitiesWithMetrics(url, ogcFormat);
      if (capabilities) {
        const count = capabilities.layers?.length ?? 0;
        return {
          ok: true,
          message: `${count} ${count === 1 ? 'layer' : 'layers'} available`,
          diagnostic,
        };
      }
      return fail(diagnostic ?? { category: 'unknown', title: "Couldn't fetch capabilities" });
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
        // fall through to HEAD probe
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const startedAt = performance.now();
      try {
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        const durationMs = performance.now() - startedAt;
        if (res.ok || res.status === 403) {
          return { ok: true, message: 'Endpoint reachable (listing not permitted)' };
        }
        const httpDiag = classifyHttpResponse(res, { durationMs });
        return fail(
          httpDiag ?? {
            category: 'http-other',
            title: `Endpoint returned HTTP ${res.status}`,
            httpStatus: res.status,
            durationMs,
          },
        );
      } catch (err) {
        return fail(
          classifyFetchError(err, { url, durationMs: performance.now() - startedAt }),
        );
      } finally {
        clearTimeout(timer);
      }
    }

    return fail({ category: 'unknown', title: 'Unsupported service type' });
  } catch (err) {
    return fail(classifyFetchError(err, { url }));
  }
}
