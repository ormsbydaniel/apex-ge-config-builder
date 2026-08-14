import { describe, expect, it } from 'vitest';
import { applyOgcServiceVersion, mergeWmsParameters, recordToRows, rowsToRecord } from '../ParametersEditor';
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

describe('OGC service version placement', () => {
  it('stores the negotiated WMTS version as a top-level property', () => {
    expect(applyOgcServiceVersion({}, 'wmts', [], '1.0.0')).toEqual({
      version: '1.0.0',
    });
  });

  it('keeps WMS and WMTS version shapes separate', () => {
    expect(applyOgcServiceVersion({ version: '1.0.0' }, 'wms', [], '1.3.0')).toEqual({
      parameters: { version: '1.3.0' },
    });
    expect(applyOgcServiceVersion({ parameters: { version: '1.3.0' } }, 'wmts', [], '1.0.0')).toEqual({
      version: '1.0.0',
    });
  });

  it('does not add a version to direct or unrelated data sources', () => {
    expect(applyOgcServiceVersion({}, 'wmts', [])).toEqual({});
    expect(applyOgcServiceVersion({ version: '1.0.0' }, 'cog', [])).toEqual({});
  });

  it('preserves a top-level WMTS version through data source validation', () => {
    const parsed = DataSourceItemSchema.parse({
      url: 'https://example.test/wmts',
      format: 'wmts',
      zIndex: 50,
      layers: 'example-layer',
      useTimeParameter: false,
      version: '1.0.0',
    });

    expect(parsed.version).toBe('1.0.0');
  });
});