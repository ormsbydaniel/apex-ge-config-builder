import { fromUrl } from 'geotiff';

export interface CogMetadata {
  // Image Properties
  width?: number;
  height?: number;
  samplesPerPixel?: number;
  bitsPerSample?: number[];
  compression?: number;
  photometricInterpretation?: number;
  
  // Geospatial
  modelPixelScale?: number[];
  modelTiepoint?: number[];
  geoKeyDirectory?: any;
  boundingBox?: [number, number, number, number];
  
  // TIFF Tags
  dateTime?: string;
  software?: string;
  imageDescription?: string;
  
  // Data Information
  noDataValue?: number;
  minValue?: number;
  maxValue?: number;
}

export async function fetchCogMetadata(url: string): Promise<CogMetadata> {
  try {
    const tiff = await fromUrl(url);
    const image = await tiff.getImage();
    const fileDirectory = image.fileDirectory;
    
    const metadata: CogMetadata = {
      // Image Properties
      width: image.getWidth(),
      height: image.getHeight(),
      samplesPerPixel: fileDirectory.SamplesPerPixel,
      bitsPerSample: fileDirectory.BitsPerSample,
      compression: fileDirectory.Compression,
      photometricInterpretation: fileDirectory.PhotometricInterpretation,
      
      // Geospatial
      modelPixelScale: fileDirectory.ModelPixelScale,
      modelTiepoint: fileDirectory.ModelTiepoint,
      geoKeyDirectory: fileDirectory.GeoKeyDirectory,
      
      // TIFF Tags
      dateTime: fileDirectory.DateTime,
      software: fileDirectory.Software,
      imageDescription: fileDirectory.ImageDescription,
      
      // Data Information
      noDataValue: fileDirectory.GDAL_NODATA ? parseFloat(fileDirectory.GDAL_NODATA) : undefined,
    };
    
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
    
    return metadata;
  } catch (error) {
    throw new Error(`Failed to fetch COG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function formatMetadataForDisplay(metadata: CogMetadata): Array<{ category: string; items: Array<{ label: string; value: string }> }> {
  const sections = [];
  
  // Image Properties
  const imageProps = [];
  if (metadata.width !== undefined) imageProps.push({ label: 'Width', value: `${metadata.width} px` });
  if (metadata.height !== undefined) imageProps.push({ label: 'Height', value: `${metadata.height} px` });
  if (metadata.samplesPerPixel !== undefined) imageProps.push({ label: 'Bands', value: metadata.samplesPerPixel.toString() });
  if (metadata.bitsPerSample) imageProps.push({ label: 'Bits per Sample', value: metadata.bitsPerSample.join(', ') });
  if (metadata.compression !== undefined) imageProps.push({ label: 'Compression', value: getCompressionName(metadata.compression) });
  
  if (imageProps.length > 0) {
    sections.push({ category: 'Image Properties', items: imageProps });
  }
  
  // Geospatial
  const geoProps = [];
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
  if (metadata.imageDescription) tiffProps.push({ label: 'Description', value: metadata.imageDescription });
  
  if (tiffProps.length > 0) {
    sections.push({ category: 'TIFF Tags', items: tiffProps });
  }
  
  // Data Information
  const dataProps = [];
  if (metadata.noDataValue !== undefined) dataProps.push({ label: 'NoData Value', value: metadata.noDataValue.toString() });
  
  if (dataProps.length > 0) {
    sections.push({ category: 'Data Information', items: dataProps });
  }
  
  return sections;
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
