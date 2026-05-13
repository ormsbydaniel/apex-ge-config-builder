import { DataSourceFormat } from '@/types/config';

/**
 * STAC-specific utility functions for URL handling, format detection, and API helpers
 */

export interface StacLink {
  rel: string;
  href: string;
  type?: string;
  method?: string;
}

export interface StacAsset {
  href: string;
  type?: string;
  title?: string;
  roles?: string[];
  'file:size'?: number;
}

export interface StacCollection {
  id: string;
  title?: string;
  description?: string;
  keywords?: string[];
  extent?: any;
  links?: StacLink[];
}

/**
 * Ensures a URL ends with a trailing slash
 */
export const ensureSlash = (url: string): string => 
  url.endsWith('/') ? url : url + '/';

/**
 * Appends a query parameter to a URL, handling existing query strings
 */
export const appendQueryParam = (url: string, key: string, value: string | number): string => {
  const hasQuery = url.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
};

/**
 * Creates a STAC browser URL for external viewing
 * Uses different browser bases depending on service domain
 */
export const createStacBrowserUrl = (selfUrl: string, serviceUrl: string): string => {
  // Determine the browser base URL based on service domain
  const isEoresults = serviceUrl.toLowerCase().includes('eoresults');
  const browserBase = isEoresults 
    ? 'https://browser.apex.esa.int/external/'
    : 'https://radiantearth.github.io/stac-browser/#/external/';
  
  // Strip protocol from self URL
  const urlWithoutProtocol = selfUrl.replace(/^https?:\/\//, '');
  
  return `${browserBase}${urlWithoutProtocol}`;
};

/**
 * Constructs the items URL for a STAC collection.
 * Prefers a `rel: "items"` link (resolved against collectionBaseUrl when relative).
 * Falls back to the API-style `<serviceUrl>/collections/{id}/items?limit=100`.
 * For static collections that only expose individual `rel: "item"` links, callers
 * should use `getItemLinks` instead.
 */
export const getItemsUrl = (
  collection: StacCollection,
  serviceUrl: string,
  collectionBaseUrl?: string
): string => {
  const link = collection.links?.find((l) => l.rel === 'items');
  let url: string;
  if (link?.href) {
    url = collectionBaseUrl ? resolveAssetUrl(link.href, collectionBaseUrl) : link.href;
  } else {
    url = ensureSlash(serviceUrl) + `collections/${collection.id}/items`;
  }
  if (!/[?&]limit=/.test(url)) {
    url = appendQueryParam(url, 'limit', 100);
  }
  return url;
};

/**
 * Returns all `rel: "item"` link hrefs from a static STAC collection,
 * resolved against the collection's own URL (or service URL fallback).
 */
export const getItemLinks = (
  collection: StacCollection,
  baseUrl: string
): string[] => {
  return (collection.links || [])
    .filter((l) => l.rel === 'item')
    .map((l) => resolveAssetUrl(l.href, baseUrl));
};

/**
 * Returns all `rel: "child"` links from a STAC catalog, resolved against the
 * catalog's own URL.
 */
export const getChildLinks = (
  links: StacLink[] | undefined,
  baseUrl: string
): { href: string; title?: string; type?: string }[] => {
  return (links || [])
    .filter((l) => l.rel === 'child')
    .map((l) => ({
      href: resolveAssetUrl(l.href, baseUrl),
      title: (l as any).title,
      type: l.type,
    }));
};

/**
 * Returns all `rel: "xyz"` tile-template links from a STAC resource,
 * resolved against the resource's own URL. XYZ links carry a
 * `{z}/{x}/{y}` URL template and represent renderable tile services.
 */
export const getXyzTileLinks = (
  links: StacLink[] | undefined,
  baseUrl: string
): { href: string; title?: string; type?: string }[] => {
  return (links || [])
    .filter((l) => l.rel === 'xyz')
    .map((l) => ({
      // Tile templates contain `{z}/{x}/{y}` and must NOT be URL-resolved
      // (resolveAssetUrl would percent-encode the braces). They're always
      // absolute in practice, so keep href as-is.
      href: /^https?:\/\//i.test(l.href) ? l.href : resolveAssetUrl(l.href, baseUrl),
      title: (l as any).title,
      type: l.type,
    }));
};

/**
 * Best-effort guess of whether a child link points to a Catalog or Collection
 * based on its href. Falls back to `'unknown'` when ambiguous.
 */
export const inferChildKind = (href: string): 'catalog' | 'collection' | 'unknown' => {
  const lower = href.toLowerCase();
  if (lower.endsWith('/collection.json') || lower.includes('/collection.json?')) return 'collection';
  if (lower.endsWith('/catalog.json') || lower.includes('/catalog.json?')) return 'catalog';
  return 'unknown';
};

/**
 * Extracts the 'next' link from STAC API response for pagination
 */
export const extractNextLink = (data: any): string | null => {
  const links = data.links || [];
  const nextLink = links.find((link: any) => link.rel === 'next');
  return nextLink?.href || null;
};

/**
 * Detects the format of a STAC asset based on MIME type and file extension
 * Returns a DataSourceFormat if recognized, or a display-friendly string otherwise
 */
export const detectAssetFormat = (asset: StacAsset): DataSourceFormat | string => {
  const href = asset.href.toLowerCase();
  const type = asset.type?.toLowerCase() || '';

  // XYZ tile templates (e.g. .../{z}/{y}/{x}.png) — must come before extension checks
  if (href.includes('{z}') && href.includes('{x}') && href.includes('{y}')) return 'xyz';

  // Check by media type first
  if (type.includes('tiff') || type.includes('geotiff')) return 'cog';
  if (type.includes('json')) return 'geojson';
  if (type.includes('flatgeobuf')) return 'flatgeobuf';
  if (type === 'text/csv' || type.includes('csv')) return 'csv';
  
  // Check by file extension
  if (href.includes('.tif') || href.includes('.tiff')) return 'cog';
  if (href.includes('.json') || href.includes('.geojson')) return 'geojson';
  if (href.includes('.fgb')) return 'flatgeobuf';
  if (href.includes('.csv')) return 'csv';
  
  // Return actual MIME type or format for unknown types
  if (asset.type) {
    // Clean up common MIME type prefixes for display
    return asset.type
      .replace('application/x-', '')
      .replace('application/', '')
      .replace('image/', '')
      .toUpperCase();
  }
  
  // Extract extension from URL as last resort
  const match = href.match(/\.([a-z0-9]+)(\?|$)/i);
  if (match) {
    return match[1].toUpperCase();
  }
  
  return 'UNKNOWN';
};

/**
 * Extracts the 'self' link from a STAC resource
 */
export const getSelfLink = (links?: StacLink[]): string | null => {
  return links?.find(l => l.rel === 'self')?.href || null;
};

/**
 * Resolves STAC asset URLs (absolute, root-relative, or relative)
 * Handles various URL formats relative to the service base URL
 */
export const resolveAssetUrl = (href: string, serviceUrl: string): string => {
  try {
    if (/^https?:\/\//i.test(href) || href.startsWith('data:')) return href;
    const origin = new URL(serviceUrl).origin;
    if (href.startsWith('/')) return origin + href;
    // If serviceUrl ends with a filename (e.g. .../catalog.json), resolve
    // relative hrefs against that URL directly so the filename is replaced.
    // Otherwise treat it as a directory and ensure a trailing slash.
    const base = new URL(serviceUrl);
    const looksLikeFile = /\/[^\/?#]+\.[^\/?#]+$/.test(base.pathname);
    const baseStr = looksLikeFile ? serviceUrl : ensureSlash(serviceUrl);
    return new URL(href, baseStr).toString();
  } catch (e) {
    console.warn('Failed to resolve asset URL, returning original href', href, e);
    return href;
  }
};
