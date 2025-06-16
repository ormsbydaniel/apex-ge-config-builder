/**
 * URL display utilities for handling long URLs in LayerCards
 */

/**
 * Extracts a meaningful display name from a URL based on the format type
 */
export const extractDisplayName = (url: string, format: string): string => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    
    switch (format.toLowerCase()) {
      case 'cog':
      case 'geotiff':
        // For COG files, extract the filename
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop() || '';
        return filename || 'COG File';
        
      case 'wms':
      case 'wmts':
        // For WMS/WMTS, try to extract layer name from URL parameters
        const layers = urlObj.searchParams.get('layers') || 
                      urlObj.searchParams.get('LAYERS') ||
                      urlObj.searchParams.get('layer') ||
                      urlObj.searchParams.get('LAYER');
        
        if (layers) {
          return layers;
        }
        
        // Fallback to service name or domain
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        const serviceName = pathParts[pathParts.length - 1];
        return serviceName || urlObj.hostname;
        
      case 'flatgeobuf':
      case 'geojson':
        // For vector formats, extract filename
        const vectorFilename = urlObj.pathname.split('/').pop() || '';
        return vectorFilename || 'Vector File';
        
      default:
        // For other formats, try to get a meaningful part
        const defaultFilename = urlObj.pathname.split('/').pop() || '';
        return defaultFilename || urlObj.hostname;
    }
  } catch (error) {
    // If URL parsing fails, try to extract filename from path
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart || 'Data Source';
  }
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
