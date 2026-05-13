/**
 * Pure helpers that classify service-probe failures into a structured
 * diagnostic object. No network calls — callers feed in the error / response
 * they already have, plus a small amount of context.
 *
 * The browser deliberately hides whether a `TypeError` from `fetch` was a DNS
 * failure, a refused connection, or a CORS rejection. We use `navigator.onLine`
 * and a same-origin check as a heuristic to give the user the most useful
 * guidance possible.
 */

import { checkMixedContent } from '@/utils/transportSecurityProbe';

export type ProbeFailureCategory =
  | 'invalid-url'
  | 'mixed-content'
  | 'timeout'
  | 'network'
  | 'cors'
  | 'http-auth'
  | 'http-not-found'
  | 'http-server'
  | 'http-other'
  | 'bad-content-type'
  | 'parse-xml'
  | 'parse-json'
  | 'empty'
  | 'unknown';

export interface ProbeDiagnostic {
  category: ProbeFailureCategory;
  /** One-line summary suitable as a heading. */
  title: string;
  /** Optional one-line technical detail (e.g. "HTTP 403 in 240 ms"). */
  detail?: string;
  /** Optional one-line suggestion of what the user can try next. */
  hint?: string;
  httpStatus?: number;
  durationMs?: number;
}

const isSameOrigin = (url: string): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
};

const formatMs = (ms?: number): string | undefined =>
  typeof ms === 'number' && Number.isFinite(ms)
    ? ms >= 1000
      ? `${(ms / 1000).toFixed(1)}s`
      : `${Math.round(ms)} ms`
    : undefined;

/** Validate URL syntax. Returns a diagnostic when malformed. */
export function classifyInvalidUrl(url: string): ProbeDiagnostic | undefined {
  try {
    new URL(url);
    return undefined;
  } catch {
    return {
      category: 'invalid-url',
      title: 'URL is not well-formed',
      hint: 'Check for typos and that the address starts with http:// or https://',
    };
  }
}

/** Mixed-content guard (HTTP URL on HTTPS page). */
export function classifyMixedContent(url: string): ProbeDiagnostic | undefined {
  const issue = checkMixedContent(url);
  if (!issue) return undefined;
  return {
    category: 'mixed-content',
    title: 'Browser blocks HTTP requests from this HTTPS page',
    detail: issue.message,
    hint: 'Use the https:// version of the endpoint, if available.',
  };
}

/**
 * Map a fetch-thrown error to a diagnostic. `ctx.url` is required so we can
 * disambiguate cross-origin failures (likely CORS) from same-origin ones
 * (likely network).
 */
export function classifyFetchError(
  err: unknown,
  ctx: { url: string; durationMs?: number },
): ProbeDiagnostic {
  const detail = formatMs(ctx.durationMs);
  // Abort / timeout
  if (err instanceof Error && (err.name === 'AbortError' || /aborted/i.test(err.message))) {
    return {
      category: 'timeout',
      title: 'Server did not respond in time',
      detail,
      hint: 'The endpoint may be slow or overloaded — try again, or check the URL.',
      durationMs: ctx.durationMs,
    };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const sameOrigin = isSameOrigin(ctx.url);

  // TypeError from fetch — could be DNS failure, refused connection, or CORS.
  if (err instanceof TypeError) {
    if (!isOnline) {
      return {
        category: 'network',
        title: 'Browser is offline',
        hint: 'Restore your network connection and try again.',
      };
    }
    if (!sameOrigin) {
      return {
        category: 'cors',
        title: 'Endpoint did not return CORS headers',
        detail: detail ? `Cross-origin request failed after ${detail}` : 'Cross-origin request failed',
        hint: 'The server must send Access-Control-Allow-Origin for this site, or you need a proxy.',
        durationMs: ctx.durationMs,
      };
    }
    return {
      category: 'network',
      title: 'Endpoint is unreachable',
      detail,
      hint: 'Check the host name and that the server is running.',
      durationMs: ctx.durationMs,
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return {
    category: 'unknown',
    title: 'Unexpected error',
    detail: message || undefined,
    durationMs: ctx.durationMs,
  };
}

/**
 * Classify an HTTP-level problem. Returns undefined when the response looks
 * acceptable. `expectedKind` lets us flag "got HTML when we asked for capabilities".
 */
export function classifyHttpResponse(
  res: Response,
  opts: { expectedKind?: 'xml' | 'json'; durationMs?: number } = {},
): ProbeDiagnostic | undefined {
  const detail = (() => {
    const ms = formatMs(opts.durationMs);
    return ms ? `HTTP ${res.status} in ${ms}` : `HTTP ${res.status}`;
  })();

  if (res.type === 'opaqueredirect') {
    return {
      category: 'http-other',
      title: 'Redirect could not be followed',
      detail,
      hint: 'The endpoint redirects to a location the browser cannot follow — try the redirect target directly.',
      httpStatus: res.status,
      durationMs: opts.durationMs,
    };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return {
        category: 'http-auth',
        title: res.status === 401 ? 'Endpoint requires authentication' : 'Access denied by the endpoint',
        detail,
        hint: 'Check credentials, API keys, or whether the endpoint is public.',
        httpStatus: res.status,
        durationMs: opts.durationMs,
      };
    }
    if (res.status === 404) {
      return {
        category: 'http-not-found',
        title: 'Endpoint not found (404)',
        detail,
        hint: 'Verify the path. For WMS/WMTS/WFS, point at the service endpoint, not a tile URL.',
        httpStatus: res.status,
        durationMs: opts.durationMs,
      };
    }
    if (res.status >= 500) {
      return {
        category: 'http-server',
        title: `Server error (HTTP ${res.status})`,
        detail,
        hint: 'The endpoint reported an internal error — try again later.',
        httpStatus: res.status,
        durationMs: opts.durationMs,
      };
    }
    return {
      category: 'http-other',
      title: `Unexpected response (HTTP ${res.status})`,
      detail,
      httpStatus: res.status,
      durationMs: opts.durationMs,
    };
  }

  // Successful HTTP, but content-type sanity check.
  const contentType = (res.headers.get('Content-Type') || '').toLowerCase();
  if (opts.expectedKind && contentType) {
    const isHtml = contentType.includes('text/html');
    if (isHtml) {
      return {
        category: 'bad-content-type',
        title: 'Server returned HTML, not a capabilities document',
        detail: `Content-Type: ${contentType.split(';')[0]}`,
        hint: 'The URL likely points to a login page or web UI rather than the service endpoint.',
        durationMs: opts.durationMs,
      };
    }
  }

  return undefined;
}

/** Single-line fallback string for callers that still want a one-liner. */
export function formatDiagnostic(d: ProbeDiagnostic): string {
  const parts = [d.title];
  if (d.detail) parts.push(d.detail);
  if (d.hint) parts.push(d.hint);
  return parts.join(' — ');
}
