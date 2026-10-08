/**
 * URL display utilities for handling long URLs in LayerCards
 */

/** Maximum number of characters shown for a data source display name. */
export const DISPLAY_NAME_MAX_LENGTH = 80;

/**
 * Truncates a display name to the maximum length, appending an ellipsis.
 */
export const truncateDisplayName = (name: string, maxLength: number = DISPLAY_NAME_MAX_LENGTH): string => {
  if (!name || name.length <= maxLength) return name;
  return `${name.slice(0, maxLength)}…`;
};

/**
 * Extracts a meaningful display name from a URL based on the format type.
 * When `truncate` is true (default) names longer than the display cap are cut
 * with an ellipsis; pass false to get the full, untruncated name (for tooltips).
 */
export const extractDisplayName = (url: string, format: string, truncate: boolean = true): string => {
  const cap = (name: string): string => (truncate ? truncateDisplayName(name) : name);

  if (!url) return '';

  try {
    const urlObj = new URL(url);

    switch (format.toLowerCase()) {
      case 'cog':
      case 'geotiff':
        // For COG files, extract the filename
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop() || '';
        return cap(filename || 'COG File');

      case 'wms':
      case 'wmts':
        // For WMS/WMTS, try to extract layer name from URL parameters
        const layers = urlObj.searchParams.get('layers') ||
                      urlObj.searchParams.get('LAYERS') ||
                      urlObj.searchParams.get('layer') ||
                      urlObj.searchParams.get('LAYER');

        if (layers) {
          return cap(layers);
        }

        // Fallback to service name or domain
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        const serviceName = pathParts[pathParts.length - 1];
        return cap(serviceName || urlObj.hostname);

      case 'flatgeobuf':
      case 'geojson':
        // For vector formats, extract filename
        const vectorFilename = urlObj.pathname.split('/').pop() || '';
        return cap(vectorFilename || 'Vector File');

      default:
        // For other formats, try to get a meaningful part
        const defaultFilename = urlObj.pathname.split('/').pop() || '';
        return cap(defaultFilename || urlObj.hostname);
    }
  } catch (error) {
    // If URL parsing fails, try to extract filename from path
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return cap(lastPart || 'Data Source');
  }
};

/**
 * Extracts a display name for STAC data sources.
 *
 * - Items list endpoints (`.../collections/{name}/items`) show the collection
 *   name: `{name}/items`.
 * - Single items (`.../items/{id}`) show the item ID, truncated to the display
 *   cap when it is longer.
 * - Anything else falls back to the generic display name behaviour.
 */
export const extractStacDisplayName = (url: string, truncate: boolean = true): string => {
  const cap = (name: string): string => (truncate ? truncateDisplayName(name) : name);

  if (!url) return '';

  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);

    // Items list endpoint: prefer the owning collection name
    if (segments.length >= 2 && segments[segments.length - 1] === 'items') {
      const collectionIndex = segments.length - 2;
      if (collectionIndex >= 1 && segments[collectionIndex - 1] === 'collections') {
        return cap(`${segments[collectionIndex]}/items`);
      }
      return cap(segments[segments.length - 1]);
    }

    // Single item endpoint: show the item ID
    if (segments.length >= 2 && segments[segments.length - 2] === 'items') {
      return cap(segments[segments.length - 1]);
    }
  } catch (error) {
    // Fall through to the generic behaviour for unparseable URLs
  }

  return cap(extractDisplayName(url, 'stac', truncate));
};

/**
 * Truncates a URL to a maximum length with smart ellipsis placement
 */
export const truncateUrl = (url: string, maxLength: number = 50): string => {
  if (!url || url.length <= maxLength) return url;

  // Try to keep the beginning and end of the URL
  const start = url.substring(0, Math.floor(maxLength * 0.4));
  const end = url.substring(url.length - Math.floor(maxLength * 0.4));

  return `${start}...${end}`;
};

/**
 * Gets the URL type for better display logic
 */
export const getUrlType = (url: string, format: string): 'file' | 'service' | 'unknown' => {
  const fileFormats = ['cog', 'geotiff', 'flatgeobuf', 'geojson'];
  const serviceFormats = ['wms', 'wmts', 'xyz', 'tms'];

  if (fileFormats.includes(format.toLowerCase())) {
    return 'file';
  }

  if (serviceFormats.includes(format.toLowerCase())) {
    return 'service';
  }

  return 'unknown';
};
