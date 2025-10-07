import { fromUrl } from 'geotiff';

export interface CogMetadata {
  // Image Properties
  width?: number;
  height?: number;
  samplesPerPixel?: number;
  bitsPerSample?: number[];
  compression?: number;
  photometricInterpretation?: number;
  sampleFormat?: number[];
  planarConfiguration?: number;
  tileWidth?: number;
  tileLength?: number;
  
  // File Properties
  fileSize?: number;
  overviewCount?: number;
  
  // Geospatial
  modelPixelScale?: number[];
  modelTiepoint?: number[];
  geoKeyDirectory?: any;
  boundingBox?: [number, number, number, number];
  epsgCode?: number;
  projection?: string;
  
  // TIFF Tags
  dateTime?: string;
  software?: string;
  imageDescription?: string;
  artist?: string;
  copyright?: string;
  
  // Data Information
  noDataValue?: number;
  minValue?: number;
  maxValue?: number;
  dataType?: string;
  dataNature?: 'continuous' | 'categorical' | 'unknown';
  uniqueValues?: number[];
  sampleCount?: number;
}

export async function fetchCogMetadata(url: string): Promise<CogMetadata> {
  try {
    const tiff = await fromUrl(url);
    const image = await tiff.getImage();
    const fileDirectory = image.fileDirectory;
    
    // Phase 1: Extract metadata
    const metadata: CogMetadata = {
      // Image Properties
      width: image.getWidth(),
      height: image.getHeight(),
      samplesPerPixel: fileDirectory.SamplesPerPixel,
      bitsPerSample: fileDirectory.BitsPerSample,
      compression: fileDirectory.Compression,
      photometricInterpretation: fileDirectory.PhotometricInterpretation,
      sampleFormat: fileDirectory.SampleFormat,
      planarConfiguration: fileDirectory.PlanarConfiguration,
      tileWidth: fileDirectory.TileWidth,
      tileLength: fileDirectory.TileLength,
      
      // File Properties
      overviewCount: await tiff.getImageCount() - 1,
      
      // Geospatial
      modelPixelScale: fileDirectory.ModelPixelScale,
      modelTiepoint: fileDirectory.ModelTiepoint,
      geoKeyDirectory: fileDirectory.GeoKeyDirectory,
      
      // TIFF Tags
      dateTime: fileDirectory.DateTime,
      software: fileDirectory.Software,
      imageDescription: fileDirectory.ImageDescription,
      artist: fileDirectory.Artist,
      copyright: fileDirectory.Copyright,
      
      // Data Information
      noDataValue: fileDirectory.GDAL_NODATA ? parseFloat(fileDirectory.GDAL_NODATA) : undefined,
    };
    
    // Extract EPSG code from GeoKeyDirectory
    if (metadata.geoKeyDirectory) {
      const geoKeys = metadata.geoKeyDirectory;
      // EPSG code is typically at index for key 3072 (ProjectedCSTypeGeoKey) or 2048 (GeographicTypeGeoKey)
      for (let i = 4; i < geoKeys.length; i += 4) {
        const keyId = geoKeys[i];
        if (keyId === 3072 || keyId === 2048) {
          metadata.epsgCode = geoKeys[i + 3];
          break;
        }
      }
    }
    
    // Determine data type from sample format
    if (metadata.sampleFormat && metadata.sampleFormat.length > 0) {
      metadata.dataType = getSampleFormatName(metadata.sampleFormat[0], metadata.bitsPerSample?.[0]);
    }
    
    // Get file size from HTTP headers
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        metadata.fileSize = parseInt(contentLength, 10);
      }
    } catch (e) {
      // File size not critical, continue without it
    }
    
    // Calculate bounding box if we have the necessary geospatial info
    if (metadata.modelPixelScale && metadata.modelTiepoint) {
      const [scaleX, scaleY] = metadata.modelPixelScale;
      const [, , , originX, originY] = metadata.modelTiepoint;
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      
      metadata.boundingBox = [
        originX,
        originY - (height * scaleY),
        originX + (width * scaleX),
        originY
      ];
    }
    
    // Check for pre-computed statistics in GDAL metadata
    if (fileDirectory.GDAL_METADATA) {
      try {
        const gdal = fileDirectory.GDAL_METADATA;
        const minMatch = gdal.match(/STATISTICS_MINIMUM=([-\d.]+)/);
        const maxMatch = gdal.match(/STATISTICS_MAXIMUM=([-\d.]+)/);
        if (minMatch) metadata.minValue = parseFloat(minMatch[1]);
        if (maxMatch) metadata.maxValue = parseFloat(maxMatch[1]);
      } catch (e) {
        // GDAL metadata parsing failed, will compute from samples
      }
    }
    
    // Phase 2: Compute statistics from overviews if min/max not available
    if (metadata.minValue === undefined || metadata.maxValue === undefined) {
      const stats = await computeStatisticsFromOverview(tiff, metadata.noDataValue);
      metadata.minValue = stats.min;
      metadata.maxValue = stats.max;
      metadata.dataNature = stats.dataNature;
      metadata.uniqueValues = stats.uniqueValues;
      metadata.sampleCount = stats.sampleCount;
    }
    
    return metadata;
  } catch (error) {
    throw new Error(`Failed to fetch COG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function computeStatisticsFromOverview(
  tiff: any,
  noDataValue?: number
): Promise<{
  min?: number;
  max?: number;
  dataNature: 'continuous' | 'categorical' | 'unknown';
  uniqueValues?: number[];
  sampleCount: number;
}> {
  try {
    const imageCount = await tiff.getImageCount();
    let selectedImage = await tiff.getImage(0);
    
    // If overviews exist, select an intermediate one
    if (imageCount > 1) {
      const targetPixels = 2_000_000; // Target ~2M pixels for good balance
      let bestIndex = 0;
      let bestDiff = Infinity;
      
      for (let i = 0; i < imageCount; i++) {
        const img = await tiff.getImage(i);
        const pixels = img.getWidth() * img.getHeight();
        const diff = Math.abs(pixels - targetPixels);
        
        if (diff < bestDiff && pixels <= targetPixels * 2) {
          bestDiff = diff;
          bestIndex = i;
          selectedImage = img;
        }
      }
    }
    
    // Read raster data from selected overview
    const width = selectedImage.getWidth();
    const height = selectedImage.getHeight();
    const samplesPerPixel = selectedImage.fileDirectory.SamplesPerPixel || 1;
    
    // For multi-band, just analyze first band
    const rasters = await selectedImage.readRasters({ samples: [0] });
    const data = rasters[0];
    
    let min = Infinity;
    let max = -Infinity;
    const uniqueValuesSet = new Set<number>();
    let validSampleCount = 0;
    
    // Analyze the data
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      
      // Skip no-data values
      if (noDataValue !== undefined && Math.abs(value - noDataValue) < 0.0001) {
        continue;
      }
      
      validSampleCount++;
      
      if (value < min) min = value;
      if (value > max) max = value;
      
      // Track unique values (up to a limit)
      if (uniqueValuesSet.size < 1000) {
        uniqueValuesSet.add(value);
      }
    }
    
    // Determine data nature
    let dataNature: 'continuous' | 'categorical' | 'unknown' = 'unknown';
    let uniqueValues: number[] | undefined;
    
    if (validSampleCount > 0) {
      const uniqueCount = uniqueValuesSet.size;
      const uniqueRatio = uniqueCount / validSampleCount;
      
      // Heuristic: if unique values are < 50 and represent < 1% of samples, likely categorical
      if (uniqueCount < 50 && uniqueRatio < 0.01) {
        dataNature = 'categorical';
        uniqueValues = Array.from(uniqueValuesSet).sort((a, b) => a - b);
      } else if (uniqueCount > 100 || uniqueRatio > 0.1) {
        dataNature = 'continuous';
      }
    }
    
    return {
      min: min === Infinity ? undefined : min,
      max: max === -Infinity ? undefined : max,
      dataNature,
      uniqueValues,
      sampleCount: validSampleCount,
    };
  } catch (error) {
    // If sampling fails, return minimal info
    return {
      dataNature: 'unknown',
      sampleCount: 0,
    };
  }
}

function getSampleFormatName(sampleFormat: number, bitsPerSample?: number): string {
  const bitsStr = bitsPerSample ? `${bitsPerSample}-bit ` : '';
  
  switch (sampleFormat) {
    case 1: return `${bitsStr}Unsigned Integer`;
    case 2: return `${bitsStr}Signed Integer`;
    case 3: return `${bitsStr}IEEE Floating Point`;
    case 4: return 'Undefined';
    default: return `Unknown (${sampleFormat})`;
  }
}

export function formatMetadataForDisplay(metadata: CogMetadata): Array<{ category: string; items: Array<{ label: string; value: string }> }> {
  const sections = [];
  
  // File Properties
  const fileProps = [];
  if (metadata.fileSize !== undefined) {
    fileProps.push({ label: 'File Size', value: formatFileSize(metadata.fileSize) });
  }
  if (metadata.overviewCount !== undefined) {
    fileProps.push({ label: 'Overview Levels', value: metadata.overviewCount.toString() });
  }
  if (fileProps.length > 0) {
    sections.push({ category: 'File Properties', items: fileProps });
  }
  
  // Image Properties
  const imageProps = [];
  if (metadata.width !== undefined) imageProps.push({ label: 'Width', value: `${metadata.width.toLocaleString()} px` });
  if (metadata.height !== undefined) imageProps.push({ label: 'Height', value: `${metadata.height.toLocaleString()} px` });
  if (metadata.samplesPerPixel !== undefined) imageProps.push({ label: 'Bands', value: metadata.samplesPerPixel.toString() });
  if (metadata.dataType) imageProps.push({ label: 'Data Type', value: metadata.dataType });
  if (metadata.bitsPerSample) imageProps.push({ label: 'Bits per Sample', value: metadata.bitsPerSample.join(', ') });
  if (metadata.compression !== undefined) imageProps.push({ label: 'Compression', value: getCompressionName(metadata.compression) });
  if (metadata.tileWidth) imageProps.push({ label: 'Tile Size', value: `${metadata.tileWidth} × ${metadata.tileLength || metadata.tileWidth}` });
  
  if (imageProps.length > 0) {
    sections.push({ category: 'Image Properties', items: imageProps });
  }
  
  // Data Statistics
  const dataProps = [];
  if (metadata.sampleCount !== undefined) {
    dataProps.push({ 
      label: 'Num pixels sampled', 
      value: metadata.sampleCount.toString() 
    });
  }
  if (metadata.dataNature) {
    dataProps.push({ 
      label: 'Data Nature', 
      value: metadata.dataNature.charAt(0).toUpperCase() + metadata.dataNature.slice(1) 
    });
  }
  if (metadata.minValue !== undefined) {
    dataProps.push({ label: 'Min Value', value: formatNumber(metadata.minValue) });
  }
  if (metadata.maxValue !== undefined) {
    dataProps.push({ label: 'Max Value', value: formatNumber(metadata.maxValue) });
  }
  if (metadata.noDataValue !== undefined) {
    dataProps.push({ label: 'NoData Value', value: formatNumber(metadata.noDataValue) });
  }
  if (metadata.uniqueValues && metadata.uniqueValues.length > 0) {
    dataProps.push({ 
      label: 'Unique Values', 
      value: metadata.uniqueValues.map(v => formatNumber(v)).join(', ') 
    });
  }
  
  if (dataProps.length > 0) {
    sections.push({ category: 'Data Statistics', items: dataProps });
  }
  
  // Geospatial
  const geoProps = [];
  if (metadata.epsgCode) {
    geoProps.push({ label: 'EPSG Code', value: metadata.epsgCode.toString() });
  }
  if (metadata.boundingBox) {
    geoProps.push({ 
      label: 'Bounding Box', 
      value: `[${metadata.boundingBox.map(v => v.toFixed(6)).join(', ')}]` 
    });
  }
  if (metadata.modelPixelScale) {
    geoProps.push({ 
      label: 'Pixel Scale', 
      value: `[${metadata.modelPixelScale.map(v => v.toFixed(6)).join(', ')}]` 
    });
  }
  
  if (geoProps.length > 0) {
    sections.push({ category: 'Geospatial', items: geoProps });
  }
  
  // TIFF Tags
  const tiffProps = [];
  if (metadata.dateTime) tiffProps.push({ label: 'Creation Date', value: metadata.dateTime });
  if (metadata.software) tiffProps.push({ label: 'Software', value: metadata.software });
  if (metadata.artist) tiffProps.push({ label: 'Artist', value: metadata.artist });
  if (metadata.copyright) tiffProps.push({ label: 'Copyright', value: metadata.copyright });
  if (metadata.imageDescription) tiffProps.push({ label: 'Description', value: metadata.imageDescription });
  
  if (tiffProps.length > 0) {
    sections.push({ category: 'TIFF Tags', items: tiffProps });
  }
  
  return sections;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatNumber(num: number): string {
  if (Number.isInteger(num)) return num.toLocaleString();
  if (Math.abs(num) < 0.01 || Math.abs(num) > 10000) return num.toExponential(3);
  return num.toFixed(3);
}

function getCompressionName(compression: number): string {
  const compressionMap: Record<number, string> = {
    1: 'None',
    2: 'CCITT 1D',
    3: 'Group 3 Fax',
    4: 'Group 4 Fax',
    5: 'LZW',
    6: 'JPEG (old)',
    7: 'JPEG',
    8: 'Deflate',
    32773: 'PackBits',
    34712: 'JPEG2000',
  };
  
  return compressionMap[compression] || `Unknown (${compression})`;
}
