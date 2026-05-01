/**
 * Lightweight transport-security checks for a service or asset URL.
 *
 * - Mixed content: app loaded over HTTPS but URL is HTTP → browsers will
 *   block tile/asset loads.
 * - CORS: a successful fetch from the browser already proves CORS is OK
 *   (caller passes that signal in). When fetch fails with a network/CORS
 *   error, the caller surfaces it as a reachability error, not here.
 *
 * This module only produces warning strings — it never makes network calls.
 */

export interface TransportSecurityIssue {
  message: string;
}

export function checkMixedContent(url: string): TransportSecurityIssue | undefined {
  try {
    const parsed = new URL(url);
    const pageIsHttps =
      typeof window !== 'undefined' && window.location?.protocol === 'https:';
    if (pageIsHttps && parsed.protocol === 'http:') {
      return { message: 'mixed content (HTTP URL on HTTPS page — browsers block requests)' };
    }
  } catch {
    // Invalid URL — caller handles.
  }
  return undefined;
}
