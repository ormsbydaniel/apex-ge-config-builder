/**
 * Probe a GeoJSON URL with a HEAD request to determine reachability and size.
 *
 * Returns:
 *   - status 'ok'      → reachable, size known and within threshold
 *   - status 'warning' → reachable but oversized OR size unknown (Content-Length missing)
 *   - status 'error'   → not reachable / non-2xx / network failure
 */
export interface GeoJsonProbeResult {
  status: 'ok' | 'warning' | 'error';
  bytes?: number;
  message?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

export async function probeGeojsonSize(
  url: string,
  opts: { timeoutMs?: number; largeBytes?: number } = {},
): Promise<GeoJsonProbeResult> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const largeBytes = opts.largeBytes ?? 10 * 1024 * 1024;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (!res.ok) {
      return { status: 'error', message: `HEAD ${res.status}` };
    }
    const lenHeader = res.headers.get('Content-Length');
    if (!lenHeader) {
      return { status: 'warning', message: 'Size unknown (no Content-Length header)' };
    }
    const bytes = Number(lenHeader);
    if (!Number.isFinite(bytes)) {
      return { status: 'warning', message: 'Size unknown (invalid Content-Length)' };
    }
    if (bytes > largeBytes) {
      return {
        status: 'warning',
        bytes,
        message: `Large file: ${formatBytes(bytes)} (threshold ${formatBytes(largeBytes)})`,
      };
    }
    return { status: 'ok', bytes };
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError' ? 'Request timed out' : 'Network error';
    return { status: 'error', message };
  } finally {
    clearTimeout(timer);
  }
}
