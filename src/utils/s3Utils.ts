
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

// S3-compatible object storage patterns
// Each entry: regex to match hostname, and how to extract bucket/region
const S3_COMPATIBLE_PATTERNS: Array<{
  test: (hostname: string) => boolean;
  extract: (hostname: string, pathname: string) => { bucketName: string; region: string } | null;
}> = [
  // AWS S3 Format 1: https://bucket-name.s3.region.amazonaws.com
  // AWS S3 Format 3: https://bucket-name.s3.amazonaws.com (legacy)
  {
    test: (h) => h.includes('.s3.') && h.includes('.amazonaws.com'),
    extract: (h) => {
      const parts = h.split('.');
      if (parts[1] === 's3') {
        return { bucketName: parts[0], region: parts.length > 4 ? parts[2] : 'us-east-1' };
      }
      return null;
    }
  },
  // AWS S3 Format 2: https://s3.region.amazonaws.com/bucket-name
  {
    test: (h) => h.startsWith('s3.') && h.includes('.amazonaws.com'),
    extract: (h, p) => {
      const pathParts = p.split('/').filter(s => s);
      if (pathParts.length > 0) {
        return { bucketName: pathParts[0], region: h.split('.')[1] };
      }
      return null;
    }
  },
  // OTC OBS: https://bucket-name.obs.region.otc.t-systems.com
  {
    test: (h) => h.includes('.obs.') && h.includes('.otc.t-systems.com'),
    extract: (h) => {
      const parts = h.split('.');
      if (parts[1] === 'obs') {
        return { bucketName: parts[0], region: parts[2] };
      }
      return null;
    }
  },
  // Generic S3-compatible: https://bucket-name.s3.provider.com or similar
  // Covers MinIO, Wasabi, Backblaze B2, etc. with subdomain-style bucket
  {
    test: (h) => {
      const parts = h.split('.');
      return parts.length >= 3 && (parts[1] === 's3' || parts[1] === 'obs' || parts[1] === 'oss' || parts[1] === 'cos');
    },
    extract: (h) => {
      const parts = h.split('.');
      return { bucketName: parts[0], region: parts.length > 3 ? parts[2] : 'default' };
    }
  },
];

// Parse S3 URL to extract bucket information
// Supports AWS S3, OTC OBS, and other S3-compatible object storage services
export const parseS3Url = (url: string): S3BucketInfo | null => {
  try {
    const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
    const urlObj = new URL(cleanUrl);

    for (const pattern of S3_COMPATIBLE_PATTERNS) {
      if (pattern.test(urlObj.hostname)) {
        const info = pattern.extract(urlObj.hostname, urlObj.pathname);
        if (info) {
          return { ...info, baseUrl: cleanUrl };
        }
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

    // Fallback for S3-compatible providers (e.g. OTC OBS) that don't support delimiter
    if (folders.length === 0 && files.length === 0) {
      const fallbackParams = new URLSearchParams({
        'list-type': '2',
        'max-keys': '1000',
      });
      if (prefix) {
        fallbackParams.set('prefix', prefix);
      }

      const fallbackUrl = `${bucketInfo.baseUrl}/?${fallbackParams.toString()}`;
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const fallbackXml = await fallbackResponse.text();
        const fallbackDoc = parser.parseFromString(fallbackXml, 'text/xml');

        if (!fallbackDoc.querySelector('parsererror') && !fallbackDoc.querySelector('Error')) {
          const flatObjects: S3Object[] = [];
          fallbackDoc.querySelectorAll('Contents').forEach(content => {
            const key = content.querySelector('Key')?.textContent;
            const lastModified = content.querySelector('LastModified')?.textContent;
            const size = content.querySelector('Size')?.textContent;
            if (key && lastModified && size) {
              flatObjects.push({
                key,
                lastModified,
                size: parseInt(size, 10),
                url: `${bucketInfo.baseUrl}/${key}`
              });
            }
          });

          if (flatObjects.length > 0) {
            return deriveFolderListingFromObjects(flatObjects, prefix);
          }
        }
      }
    }

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
