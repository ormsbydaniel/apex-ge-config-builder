
/**
 * Sanitizes URLs by removing spurious escape characters and quotes
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // Remove trailing escaped quotes and backslashes
  let cleanUrl = url.trim();
  
  // Remove trailing \" patterns
  cleanUrl = cleanUrl.replace(/\\"+$/, '');
  
  // Remove trailing quotes that aren't part of the URL
  cleanUrl = cleanUrl.replace(/"+$/, '');
  
  // Remove any backslashes that aren't part of the URL structure
  cleanUrl = cleanUrl.replace(/\\(?![\/])/g, '');
  
  console.log(`URL sanitization: "${url}" -> "${cleanUrl}"`);
  
  return cleanUrl;
};

/**
 * Validates if a URL is properly formatted
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Allow relative paths or absolute URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Returns a safe href for anchor tags. Only allows http, https, and mailto
 * schemes, plus relative paths. Returns undefined for javascript:, data:, and
 * other potentially dangerous URIs so the link renders inert.
 */
export const safeHref = (url: string | undefined | null): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  // Allow relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.startsWith('#')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return trimmed;
    }
    return undefined;
  } catch {
    return undefined;
  }
};
