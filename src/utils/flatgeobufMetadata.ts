import { deserialize } from 'flatgeobuf/lib/mjs/geojson';

export interface FlatGeobufMetadata {
  featureCount: number;
  geometryType: string;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  crs: string;
  hasSpatialIndex: boolean;
  columns: Array<{
    name: string;
    type: string;
  }>;
  fileSize?: number;
}

const GEOMETRY_TYPE_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Point',
  2: 'LineString',
  3: 'Polygon',
  4: 'MultiPoint',
  5: 'MultiLineString',
  6: 'MultiPolygon',
  7: 'GeometryCollection',
};

const COLUMN_TYPE_NAMES: Record<number, string> = {
  0: 'Byte',
  1: 'UByte',
  2: 'Bool',
  3: 'Short',
  4: 'UShort',
  5: 'Int',
  6: 'UInt',
  7: 'Long',
  8: 'ULong',
  9: 'Float',
  10: 'Double',
  11: 'String',
  12: 'Json',
  13: 'DateTime',
  14: 'Binary',
};

export async function fetchFlatGeobufMetadata(url: string): Promise<FlatGeobufMetadata> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch FlatGeobuf: ${response.statusText}`);
    }

    const fileSize = parseInt(response.headers.get('content-length') || '0');
    
    // Read only the header by using deserialize with a limit of 0 features
    let headerInfo: any = null;
    const iterator = deserialize(response.body as any, undefined, (header: any) => {
      headerInfo = header;
    });
    
    // We just need the header, so we don't iterate
    await iterator.next();

    if (!headerInfo) {
      throw new Error('Failed to read FlatGeobuf header');
    }

    const metadata: FlatGeobufMetadata = {
      featureCount: headerInfo.featuresCount || 0,
      geometryType: GEOMETRY_TYPE_NAMES[headerInfo.geometryType] || 'Unknown',
      bounds: {
        minX: headerInfo.envelope?.[0] || 0,
        minY: headerInfo.envelope?.[1] || 0,
        maxX: headerInfo.envelope?.[2] || 0,
        maxY: headerInfo.envelope?.[3] || 0,
      },
      crs: headerInfo.crs?.code ? `EPSG:${headerInfo.crs.code}` : 'Unknown',
      hasSpatialIndex: headerInfo.indexNodeSize > 0,
      columns: (headerInfo.columns || []).map((col: any) => ({
        name: col.name,
        type: COLUMN_TYPE_NAMES[col.type] || 'Unknown',
      })),
      fileSize: fileSize > 0 ? fileSize : undefined,
    };

    return metadata;
  } catch (error) {
    console.error('Error fetching FlatGeobuf metadata:', error);
    throw error;
  }
}
