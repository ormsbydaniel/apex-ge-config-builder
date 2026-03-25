
import { DataSourceFormat } from '@/types/config';

export interface S3Object {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

export interface S3Selection {
  url: string;
  format: DataSourceFormat;
  key: string;
}

export interface S3BucketInfo {
  bucketName: string;
  region: string;
  baseUrl: string;
}

// Parse S3 URL to extract bucket information
export const parseS3Url = (url: string): S3BucketInfo | null => {
  try {
    const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
    const urlObj = new URL(cleanUrl);
    
    // Handle different S3 URL formats
    // Format 1: https://bucket-name.s3.region.amazonaws.com
    // Format 2: https://s3.region.amazonaws.com/bucket-name
    // Format 3: https://bucket-name.s3.amazonaws.com (legacy)
    
    if (urlObj.hostname.includes('.s3.') && urlObj.hostname.includes('.amazonaws.com')) {
      const parts = urlObj.hostname.split('.');
      if (parts[1] === 's3') {
        // Format 1 or 3
        const bucketName = parts[0];
        const region = parts.length > 4 ? parts[2] : 'us-east-1'; // Default region for legacy format
        return {
          bucketName,
          region,
          baseUrl: cleanUrl
        };
      }
    } else if (urlObj.hostname.startsWith('s3.') && urlObj.pathname) {
      // Format 2
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length > 0) {
        const bucketName = pathParts[0];
        const region = urlObj.hostname.split('.')[1];
        return {
          bucketName,
          region,
          baseUrl: cleanUrl
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

// Determine file format from file extension with proper error handling
export const getFormatFromExtension = (filename: string): DataSourceFormat | null => {
  const extension = filename.toLowerCase().split('.').pop();
  
  const extensionMap: Record<string, DataSourceFormat> = {
    'fgb': 'flatgeobuf',
    'tif': 'cog',
    'tiff': 'cog',
    'geojson': 'geojson',
    'json': 'geojson', // Assume GeoJSON for .json files
    'csv': 'csv'
  };
  
  if (!extension) {
    console.warn(`No extension found for file: ${filename}`);
    return null;
  }
  
  const format = extensionMap[extension];
  if (!format) {
    console.warn(`Unrecognized format for extension: ${extension} in file: ${filename}`);
    return null;
  }
  
  return format;
};

// Check if a filename has a supported format
export const isSupportedFormat = (filename: string): boolean => {
  return getFormatFromExtension(filename) !== null;
};

// Get error message for unsupported formats
export const getUnsupportedFormatMessage = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop();
  return `Unrecognized format: ${extension}. Supported formats: .fgb (FlatGeoBuf), .tif/.tiff (COG), .geojson/.json (GeoJSON), .csv (CSV)`;
};

// Fetch S3 bucket contents using XML API
export const fetchS3BucketContents = async (bucketUrl: string): Promise<S3Object[]> => {
  try {
    const bucketInfo = parseS3Url(bucketUrl);
    if (!bucketInfo) {
      throw new Error('Invalid S3 URL format');
    }
    
    // Construct the list-objects API URL
    const listUrl = `${bucketInfo.baseUrl}/?list-type=2&max-keys=1000`;
    
    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch bucket contents: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Failed to parse S3 response XML');
    }
    
    // Check for S3 API errors
    const errorElement = xmlDoc.querySelector('Error');
    if (errorElement) {
      const code = errorElement.querySelector('Code')?.textContent || 'Unknown';
      const message = errorElement.querySelector('Message')?.textContent || 'Unknown error';
      throw new Error(`S3 API Error ${code}: ${message}`);
    }
    
    // Parse the object list
    const contents = xmlDoc.querySelectorAll('Contents');
    const objects: S3Object[] = [];
    
    contents.forEach(content => {
      const key = content.querySelector('Key')?.textContent;
      const lastModified = content.querySelector('LastModified')?.textContent;
      const size = content.querySelector('Size')?.textContent;
      
      if (key && lastModified && size) {
        objects.push({
          key,
          lastModified,
          size: parseInt(size, 10),
          url: `${bucketInfo.baseUrl}/${key}`
        });
      }
    });
    
    return objects;
  } catch (error) {
    console.error('Error fetching S3 bucket contents:', error);
    
    // Detect CORS errors (they typically manifest as TypeError with "Failed to fetch")
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'CORS Error: This S3 bucket does not allow browser access. ' +
        'The bucket needs CORS policies configured to allow cross-origin requests. ' +
        'If this is a STAC catalog (note "stac" in URL), try adding it as a STAC service instead with the catalog.json URL.'
      );
    }
    
    // Re-throw other errors with original message
    throw error;
  }
};

export interface S3FolderListing {
  folders: string[];
  files: S3Object[];
}

// Fetch S3 bucket contents for a specific prefix (folder), returning subfolders and files at that level
export const fetchS3BucketFolder = async (bucketUrl: string, prefix: string): Promise<S3FolderListing> => {
  try {
    const bucketInfo = parseS3Url(bucketUrl);
    if (!bucketInfo) {
      throw new Error('Invalid S3 URL format');
    }

    const params = new URLSearchParams({
      'list-type': '2',
      'delimiter': '/',
      'max-keys': '1000',
    });
    if (prefix) {
      params.set('prefix', prefix);
    }

    const listUrl = `${bucketInfo.baseUrl}/?${params.toString()}`;
    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch bucket contents: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Failed to parse S3 response XML');
    }

    const errorElement = xmlDoc.querySelector('Error');
    if (errorElement) {
      const code = errorElement.querySelector('Code')?.textContent || 'Unknown';
      const message = errorElement.querySelector('Message')?.textContent || 'Unknown error';
      throw new Error(`S3 API Error ${code}: ${message}`);
    }

    // Extract folders from CommonPrefixes
    const folders: string[] = [];
    const commonPrefixes = xmlDoc.querySelectorAll('CommonPrefixes');
    commonPrefixes.forEach(cp => {
      const pfx = cp.querySelector('Prefix')?.textContent;
      if (pfx) {
        folders.push(pfx);
      }
    });

    // Extract files from Contents (exclude the prefix marker itself)
    const files: S3Object[] = [];
    const contents = xmlDoc.querySelectorAll('Contents');
    contents.forEach(content => {
      const key = content.querySelector('Key')?.textContent;
      const lastModified = content.querySelector('LastModified')?.textContent;
      const size = content.querySelector('Size')?.textContent;

      if (key && lastModified && size && key !== prefix) {
        files.push({
          key,
          lastModified,
          size: parseInt(size, 10),
          url: `${bucketInfo.baseUrl}/${key}`
        });
      }
    });

    return { folders, files };
  } catch (error) {
    console.error('Error fetching S3 bucket folder:', error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'CORS Error: This S3 bucket does not allow browser access. ' +
        'The bucket needs CORS policies configured to allow cross-origin requests.'
      );
    }

    throw error;
  }
};

// Extract display name from a full S3 key or prefix (last path segment)
export const getS3DisplayName = (keyOrPrefix: string): string => {
  const trimmed = keyOrPrefix.replace(/\/$/, '');
  const segments = trimmed.split('/');
  return segments[segments.length - 1] || trimmed;
};

// Derive folder listing from a flat list of S3Objects (for cached/uploaded data)
export const deriveFolderListingFromObjects = (objects: S3Object[], prefix: string): S3FolderListing => {
  const folders = new Set<string>();
  const files: S3Object[] = [];

  objects.forEach(obj => {
    if (!obj.key.startsWith(prefix)) return;
    const remainder = obj.key.slice(prefix.length);
    const slashIndex = remainder.indexOf('/');
    if (slashIndex === -1) {
      // Direct file at this level
      files.push(obj);
    } else {
      // There's a subfolder
      folders.add(prefix + remainder.slice(0, slashIndex + 1));
    }
  });

  return { folders: Array.from(folders).sort(), files };
};

// Validate S3 URL format
export const validateS3Url = (url: string): boolean => {
  const result = parseS3Url(url) !== null;
  console.log('🧪 validateS3Url test:', { url, result });
  return result;
};
