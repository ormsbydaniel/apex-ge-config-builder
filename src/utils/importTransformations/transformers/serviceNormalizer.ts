/**
 * Service normalizer for backward compatibility
 * Ensures services have proper sourceType field based on their properties
 */

import { validateS3Url } from '@/utils/s3Utils';

export const normalizeServices = (config: any): any => {
  if (!config.services || !Array.isArray(config.services)) {
    return config;
  }

  const normalizedServices = config.services.map((service: any) => {
    // If service already has sourceType, trust it
    if (service.sourceType) {
      return service;
    }

    // Infer sourceType based on URL and format
    const isS3Service = service.url && validateS3Url(service.url);
    
    return {
      ...service,
      sourceType: isS3Service ? 's3' : 'service',
      // For S3 services, format might be 'cog' but that's ok for backward compatibility
      // The actual format will be determined by file extensions when browsing
    };
  });

  return {
    ...config,
    services: normalizedServices,
  };
};