import { fromUrl } from 'geotiff';
import { getPalette } from 'geotiff-palette';

export interface CogMetadata {
  // COG Validation
  isCloudOptimized?: boolean;
  cogValidationIssues?: string[];
  
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
  ifdCountCapped?: boolean;
  
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
  statisticsBand?: number;
  multiBand?: boolean;
  statisticsNote?: string;
  
  // Embedded Colormap (TIFF ColorMap tag 320)
  embeddedColormap?: Record<number, [number, number, number, number]>;
  hasEmbeddedColormap?: boolean;
}

export interface BandStatistics {
  min?: number;
  max?: number;
  dataNature: 'continuous' | 'categorical' | 'unknown';
  uniqueValues?: number[];
  sampleCount: number;
  note?: string;
}

/**
 * Phase 1: Fetch header metadata only (no statistics computation).
 * Uses a time-limited IFD walk instead of getImageCount() to avoid
 * hanging on hyperspectral files with hundreds of IFDs.
 */
export async function fetchCogHeaderMetadata(url: string): Promise<CogMetadata> {
  try {
    const tiff = await fromUrl(url);
    const image = await tiff.getImage();
    const fileDirectory = image.fileDirectory;
    
    // Time-limited IFD walk (5-second wall-clock limit)
    let ifdCount = 0;
    let ifdCountCapped = false;
    const startTime = Date.now();
    
    try {
      while (true) {
        if (Date.now() - startTime > 5000) {
          ifdCountCapped = true;
          break;
        }
        await tiff.getImage(ifdCount);
        ifdCount++;
      }
    } catch (e) {
      // End of IFDs reached
    }
    
    const samplesPerPixel = fileDirectory.SamplesPerPixel || 1;
    
    const metadata: CogMetadata = {
      // Image Properties
      width: image.getWidth(),
      height: image.getHeight(),
      samplesPerPixel,
      bitsPerSample: fileDirectory.BitsPerSample,
      compression: fileDirectory.Compression,
      photometricInterpretation: fileDirectory.PhotometricInterpretation,
      sampleFormat: fileDirectory.SampleFormat,
      planarConfiguration: fileDirectory.PlanarConfiguration,
      tileWidth: fileDirectory.TileWidth,
      tileLength: fileDirectory.TileLength,
      
      // File Properties
      overviewCount: Math.max(0, ifdCount - 1),
      ifdCountCapped,
      
      // Multi-band flag
      multiBand: samplesPerPixel > 1,
      
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
      // File size not critical
    }
    
    // Calculate bounding box
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
        // GDAL metadata parsing failed
      }
    }
    
    // Check for embedded colormap (palette)
    try {
      const palette = await getPalette(image);
      if (palette && Object.keys(palette).length > 0) {
        metadata.embeddedColormap = palette;
        metadata.hasEmbeddedColormap = true;
      }
    } catch (e) {
      // No colormap or error reading it
    }
    
    // Validate COG compliance
    const cogValidation = validateCogCompliance(metadata);
    metadata.isCloudOptimized = cogValidation.isValid;
    metadata.cogValidationIssues = cogValidation.issues;
    
    return metadata;
  } catch (error) {
    throw new Error(`Failed to fetch COG header metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Phase 2: Fetch band statistics for a specific band.
 * Opens the file independently, finds the best overview (capped at 20 IFDs),
 * and samples raster data with a 15-second timeout and 4M pixel guard.
 */
export async function fetchCogBandStatistics(
  url: string,
  bandIndex: number = 0,
  noDataValue?: number
): Promise<BandStatistics> {
  const abortController = new AbortController();
  
  try {
    const tiff = await fromUrl(url, { signal: abortController.signal } as any);
    
    // Find best overview, capped at 20 IFDs
    let selectedImage = await tiff.getImage(0);
    const targetPixels = 2_000_000;
    let bestDiff = Math.abs(selectedImage.getWidth() * selectedImage.getHeight() - targetPixels);
    
    for (let i = 1; i < 20; i++) {
      try {
        const img = await tiff.getImage(i);
        const pixels = img.getWidth() * img.getHeight();
        const diff = Math.abs(pixels - targetPixels);
        
        if (diff < bestDiff && pixels <= targetPixels * 2) {
          bestDiff = diff;
          selectedImage = img;
        }
      } catch (e) {
        // No more IFDs
        break;
      }
    }
    
    // Pixel guard: if smallest overview > 4M pixels, bail
    const totalPixels = selectedImage.getWidth() * selectedImage.getHeight();
    if (totalPixels > 4_000_000) {
      return {
        dataNature: 'unknown',
        sampleCount: 0,
        note: `Smallest available overview is ${(totalPixels / 1_000_000).toFixed(1)}M pixels — too large to sample safely.`,
      };
    }
    
    // Read rasters with 15-second timeout
    const rasterPromise = selectedImage.readRasters({ samples: [bandIndex] });
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort();
        reject(new Error('Band statistics timed out after 15 seconds'));
      }, 15000);
    });
    
    let rasters: any[];
    try {
      rasters = await Promise.race([rasterPromise, timeoutPromise]) as any[];
    } finally {
      clearTimeout(timeoutId!);
    }
    const data = rasters[0] as ArrayLike<number>;
    
    let min = Infinity;
    let max = -Infinity;
    const uniqueValuesSet = new Set<number>();
    let validSampleCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      
      if (noDataValue !== undefined && Math.abs(value - noDataValue) < 0.0001) {
        continue;
      }
      
      validSampleCount++;
      
      if (value < min) min = value;
      if (value > max) max = value;
      
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
    abortController.abort();
    return {
      dataNature: 'unknown',
      sampleCount: 0,
      note: error instanceof Error ? error.message : 'Failed to compute band statistics',
    };
  }
}

/**
 * Convenience wrapper — calls header then band statistics for band 0.
 * Preserves the existing API used by constraintMetadataHelpers.ts.
 */
export async function fetchCogMetadata(url: string): Promise<CogMetadata> {
  const metadata = await fetchCogHeaderMetadata(url);
  
  // Fetch statistics for band 0 if min/max not already available from GDAL metadata
  if (metadata.minValue === undefined || metadata.maxValue === undefined) {
    const stats = await fetchCogBandStatistics(url, 0, metadata.noDataValue);
    metadata.minValue = stats.min;
    metadata.maxValue = stats.max;
    metadata.dataNature = stats.dataNature;
    metadata.uniqueValues = stats.uniqueValues;
    metadata.sampleCount = stats.sampleCount;
    metadata.statisticsBand = 0;
    if (stats.note) metadata.statisticsNote = stats.note;
  }
  
  return metadata;
}

export function formatMetadataForDisplay(metadata: CogMetadata): Array<{ category: string; items: Array<{ label: string; value: string }> }> {
  const sections = [];
  
  // COG Validation (show first - most important for COG workflows)
  if (metadata.isCloudOptimized !== undefined) {
    const cogProps = [];
    cogProps.push({
      label: 'Cloud Optimized',
      value: metadata.isCloudOptimized ? '✓ Yes' : '✗ No'
    });
    
    if (metadata.cogValidationIssues && metadata.cogValidationIssues.length > 0) {
      cogProps.push({
        label: 'Issues',
        value: metadata.cogValidationIssues.join('; ')
      });
    }
    
    sections.push({ category: 'COG Validation', items: cogProps });
  }
  
  // Embedded Colormap (show second if present)
  if (metadata.hasEmbeddedColormap && metadata.embeddedColormap) {
    const colormapProps = [];
    const entries = Object.keys(metadata.embeddedColormap).length;
    colormapProps.push({
      label: 'Color Entries',
      value: entries.toString()
    });
    
    const values = Object.keys(metadata.embeddedColormap).map(Number).sort((a, b) => a - b);
    if (values.length > 0) {
      colormapProps.push({
        label: 'Value Range',
        value: `${values[0]} to ${values[values.length - 1]}`
      });
    }
    
    sections.push({ category: 'Embedded Colormap', items: colormapProps });
  }
  
  // Data Statistics — label includes band number if set
  const statsLabel = metadata.statisticsBand !== undefined
    ? `Data Statistics (Band ${metadata.statisticsBand + 1})`
    : 'Data Statistics';
    
  const dataProps = [];
  
  if (metadata.statisticsNote) {
    dataProps.push({ label: 'Note', value: metadata.statisticsNote });
  }
  
  if (metadata.sampleCount !== undefined) {
    let sampleValue = metadata.sampleCount.toString();
    if (metadata.width && metadata.height) {
      const totalPixels = metadata.width * metadata.height;
      const percentage = ((metadata.sampleCount / totalPixels) * 100).toFixed(2);
      sampleValue += ` (${percentage}%)`;
    }
    dataProps.push({ 
      label: 'Num pixels sampled', 
      value: sampleValue
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
  
  // Show placeholder message for multi-band files with no statistics yet
  if (dataProps.length === 0 && metadata.multiBand) {
    dataProps.push({ label: 'Status', value: 'Select a band to view statistics.' });
  }
  
  if (dataProps.length > 0) {
    sections.push({ category: statsLabel, items: dataProps });
  }
  
  // File Properties
  const fileProps = [];
  if (metadata.fileSize !== undefined) {
    fileProps.push({ label: 'File Size', value: formatFileSize(metadata.fileSize) });
  }
  if (metadata.overviewCount !== undefined) {
    const countDisplay = metadata.ifdCountCapped
      ? `≥ ${metadata.overviewCount} (enumeration capped)`
      : metadata.overviewCount.toString();
      
    fileProps.push({ 
      label: 'Has Overviews', 
      value: metadata.overviewCount > 0 ? 'Yes' : 'No' 
    });
    fileProps.push({ 
      label: 'Overview Levels', 
      value: countDisplay
    });
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

function validateCogCompliance(metadata: CogMetadata): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!metadata.tileWidth || !metadata.tileLength) {
    issues.push('Not tiled - uses strip-based layout instead of tiles');
  }
  
  if (!metadata.overviewCount || metadata.overviewCount === 0) {
    issues.push('No overviews (pyramids) - inefficient for zooming');
  }
  
  if (metadata.tileWidth && (metadata.tileWidth < 128 || metadata.tileWidth > 1024)) {
    issues.push(`Tile size ${metadata.tileWidth} is non-standard (recommended: 256 or 512)`);
  }
  
  const efficientCompressions = [1, 5, 7, 8, 34712];
  if (metadata.compression && !efficientCompressions.includes(metadata.compression)) {
    issues.push('Uses inefficient compression method');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
