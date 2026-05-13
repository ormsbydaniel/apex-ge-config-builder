import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  classifyFetchError,
  classifyHttpResponse,
  classifyInvalidUrl,
  classifyMixedContent,
} from '@/utils/serviceDiagnostics';

const origLocation = window.location;

const setLocation = (origin: string) => {
  const url = new URL(origin);
  Object.defineProperty(window, 'location', {
    value: { ...origLocation, href: origin, origin: url.origin, protocol: url.protocol },
    writable: true,
    configurable: true,
  });
};

describe('serviceDiagnostics', () => {
  beforeEach(() => {
    setLocation('https://app.example.com/');
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
  afterEach(() => {
    // @ts-expect-error restore
    window.location = origLocation;
  });

  describe('classifyInvalidUrl', () => {
    it('rejects malformed URLs', () => {
      expect(classifyInvalidUrl('not a url')?.category).toBe('invalid-url');
    });
    it('passes valid URLs', () => {
      expect(classifyInvalidUrl('https://example.com/wms')).toBeUndefined();
    });
  });

  describe('classifyMixedContent', () => {
    it('flags http URLs on https pages', () => {
      const d = classifyMixedContent('http://example.com/wms');
      expect(d?.category).toBe('mixed-content');
    });
    it('allows https URLs', () => {
      expect(classifyMixedContent('https://example.com/wms')).toBeUndefined();
    });
  });

  describe('classifyFetchError', () => {
    it('maps AbortError to timeout', () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      const d = classifyFetchError(err, { url: 'https://x.example.com/' });
      expect(d.category).toBe('timeout');
    });

    it('maps TypeError offline to network', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const d = classifyFetchError(new TypeError('Failed to fetch'), { url: 'https://x.example.com/' });
      expect(d.category).toBe('network');
    });

    it('maps cross-origin TypeError to cors when online', () => {
      const d = classifyFetchError(new TypeError('Failed to fetch'), { url: 'https://other.example.com/' });
      expect(d.category).toBe('cors');
    });

    it('maps same-origin TypeError to network when online', () => {
      const d = classifyFetchError(new TypeError('Failed to fetch'), { url: 'https://app.example.com/api' });
      expect(d.category).toBe('network');
    });

    it('falls back to unknown for arbitrary errors', () => {
      const d = classifyFetchError(new Error('boom'), { url: 'https://x.example.com/' });
      expect(d.category).toBe('unknown');
      expect(d.detail).toBe('boom');
    });
  });

  describe('classifyHttpResponse', () => {
    const make = (status: number, headers: Record<string, string> = {}) =>
      new Response('x', { status, headers });

    it('returns undefined for ok JSON-ish responses', () => {
      expect(classifyHttpResponse(make(200, { 'Content-Type': 'application/xml' }), { expectedKind: 'xml' }))
        .toBeUndefined();
    });

    it('flags 401 as http-auth', () => {
      expect(classifyHttpResponse(make(401))?.category).toBe('http-auth');
    });

    it('flags 403 as http-auth', () => {
      expect(classifyHttpResponse(make(403))?.category).toBe('http-auth');
    });

    it('flags 404 as http-not-found', () => {
      expect(classifyHttpResponse(make(404))?.category).toBe('http-not-found');
    });

    it('flags 500 as http-server', () => {
      expect(classifyHttpResponse(make(500))?.category).toBe('http-server');
    });

    it('flags HTML content-type when expecting XML', () => {
      const d = classifyHttpResponse(make(200, { 'Content-Type': 'text/html; charset=utf-8' }), { expectedKind: 'xml' });
      expect(d?.category).toBe('bad-content-type');
    });
  });
});
