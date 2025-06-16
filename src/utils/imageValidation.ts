
/**
 * Validates and filters images to ensure they have valid URLs
 */
export const validateImages = (images?: Array<{ url?: string }>): Array<{ url: string }> => {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  
  return images
    .filter(img => img && img.url && typeof img.url === 'string' && img.url.trim())
    .map(img => ({ url: img.url as string }));
};

/**
 * Type guard to check if an image has a valid URL
 */
export const hasValidUrl = (img: any): img is { url: string } => {
  return img && typeof img.url === 'string' && img.url.trim();
};
