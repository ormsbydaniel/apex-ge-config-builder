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
 * Constructs the items URL for a STAC collection
 * Adds default limit parameter if not present
 */
export const getItemsUrl = (collection: StacCollection, serviceUrl: string): string => {
  const link = collection.links?.find((l) => l.rel === 'items');
  let url = link?.href || (ensureSlash(serviceUrl) + `collections/${collection.id}/items`);
  if (!/[?&]limit=/.test(url)) {
    url = appendQueryParam(url, 'limit', 100);
  }
  return url;
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
    return new URL(href, ensureSlash(serviceUrl)).toString();
  } catch (e) {
    console.warn('Failed to resolve asset URL, returning original href', href, e);
    return href;
  }
};
