import { describe, expect, it } from 'vitest';
import { mergeWmsParameters, recordToRows, rowsToRecord } from '../ParametersEditor';
import { DataSourceItemSchema } from '@/schemas/configSchema';

describe('WMS parameter handling', () => {
  it('merges the negotiated service version with custom parameters', () => {
    expect(mergeWmsParameters([{ key: 'token', value: 'public' }], '1.3.0')).toEqual({
      token: 'public',
      version: '1.3.0',
    });
  });

  it('uses the reported older version instead of hard-coding WMS 1.3.0', () => {
    expect(mergeWmsParameters([], '1.1.1')).toEqual({ version: '1.1.1' });
  });

  it('keeps protocol-managed keys out of the editable parameter rows', () => {
    expect(recordToRows({ version: '1.3.0', service: 'WMS', styles: 'default' })).toEqual([
      { key: 'styles', value: 'default' },
    ]);
    expect(rowsToRecord([{ key: 'version', value: '9.9.9' }])).toEqual({});
  });

  it('does not add a version when no WMS service version was supplied', () => {
    expect(mergeWmsParameters([{ key: 'styles', value: 'default' }])).toEqual({
      styles: 'default',
    });
  });

  it('preserves the negotiated version through data source validation', () => {
    const parsed = DataSourceItemSchema.parse({
      url: 'https://example.test/wms',
      format: 'wms',
      zIndex: 3,
      layers: 'example-layer',
      parameters: { version: '1.3.0' },
    });

    expect(parsed.parameters).toEqual({ version: '1.3.0' });
  });
});