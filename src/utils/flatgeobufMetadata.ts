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

/** Bytes requested up front; FlatGeobuf headers are almost always far smaller. */
export const HEADER_RANGE_BYTES = 65536;

/** Parse the header from a (possibly truncated) leading byte buffer. */
const headerFromBytes = async (bytes: Uint8Array): Promise<any | null> => {
  let header: any = null;
  try {
    const it = deserialize(bytes, undefined, (h: any) => { header = h; }) as any;
    await it.next();
  } catch {
    // Truncated feature data after the header is expected.
  }
  return header;
};

/** Fallback for servers without Range support: stream and abort after the header. */
const headerFromStream = async (url: string): Promise<{ header: any; size: number }> => {
  const controller = new AbortController();
  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) throw new Error(`Failed to fetch FlatGeobuf: ${response.status} ${response.statusText}`);
  const size = parseInt(response.headers.get('content-length') || '0');
  let header: any = null;
  try {
    const it = deserialize(response.body as any, undefined, (h: any) => { header = h; }) as any;
    await it.next();
  } catch (e) {
    if (!header) throw e;
  } finally {
    controller.abort();
  }
  return { header, size };
};

export async function fetchFlatGeobufMetadata(url: string): Promise<FlatGeobufMetadata> {
  try {
    // Request only the leading bytes, so probing many (or huge) files stays cheap.
    const response = await fetch(url, { headers: { Range: `bytes=0-${HEADER_RANGE_BYTES - 1}` } });
    if (!response.ok) {
      throw new Error(`Failed to fetch FlatGeobuf: ${response.status} ${response.statusText}`);
    }

    let headerInfo: any = null;
    let fileSize = 0;
    if (response.status === 206) {
      const total = response.headers.get('content-range')?.split('/')[1];
      fileSize = total && total !== '*' ? parseInt(total) : 0;
      headerInfo = await headerFromBytes(new Uint8Array(await response.arrayBuffer()));
    } else {
      // Range ignored: don't download the whole body here.
      await response.body?.cancel().catch(() => undefined);
    }
    if (!headerInfo) {
      const streamed = await headerFromStream(url);
      headerInfo = streamed.header;
      fileSize = fileSize || streamed.size;
    }

    if (!headerInfo) {
      throw new Error('Failed to read FlatGeobuf header');
    }

    return {
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
  } catch (error) {
    console.error('Error fetching FlatGeobuf metadata:', error);
    throw error;
  }
}
