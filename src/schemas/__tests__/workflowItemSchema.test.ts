import { describe, it, expect } from 'vitest';
import { DataSourceSchema } from '../configSchema';

// Minimal source wrapper used to drive validation of the workflows[] array
// through the public DataSourceSchema surface.
const wrap = (workflows: unknown[]) => ({
  name: 'host',
  isActive: true,
  data: [{ format: 'cog', zIndex: 1, url: 'https://example.com/x.tif' }],
  workflows,
});

describe('WorkflowItemSchema (canonical SourceShape)', () => {
  it('accepts Shape A (meta + data + bands, no serviceDetails)', () => {
    const shapeA = {
      serviceId: 'svc-a',
      serviceProvider: 'provider-a',
      meta: {
        description: '',
        attribution: { text: '' },
        categories: [{ color: '#fff', label: 'A', value: 1 }],
      },
      data: [
        { format: 'cog', zIndex: 100, convertToRGB: true, bands: [1, 2, 3] },
      ],
    };
    const result = DataSourceSchema.safeParse(wrap([shapeA]));
    expect(result.success).toBe(true);
  });

  it('accepts Shape B (serviceDetails, no meta/data)', () => {
    const shapeB = {
      serviceId: 'gep_api_ost',
      serviceProvider: 'terradue',
      serviceDetails: {
        endpoint: 'https://geohazards-tep.eu/some/endpoint',
        namespace: 'ns',
        application: 'app',
      },
    };
    const result = DataSourceSchema.safeParse(wrap([shapeB]));
    expect(result.success).toBe(true);
  });

  it('accepts a workflow entry carrying the full source surface', () => {
    const rich = {
      serviceId: 'svc-rich',
      serviceProvider: 'provider',
      serviceDetails: { endpoint: 'https://x' },
      meta: { description: 'd', attribution: { text: 't' } },
      data: [{ format: 'cog', zIndex: 1 }],
      statistics: [],
      constraints: [],
      charts: [],
      timeframe: 'Days' as const,
      defaultTimestamp: 0,
      isMirrorLayer: true,
      exclusivitySets: ['a'],
      hasFeatureStatistics: true,
    };
    const result = DataSourceSchema.safeParse(wrap([rich]));
    expect(result.success).toBe(true);
  });

  it('accepts legacy zIndex/service/label workflow entries', () => {
    const legacy = { zIndex: 100, service: 'old', label: 'L' };
    // serviceId/serviceProvider missing — passthrough+all-optional should still parse
    const result = DataSourceSchema.safeParse(
      wrap([{ serviceId: 'x', serviceProvider: 'y', ...legacy }])
    );
    expect(result.success).toBe(true);
  });

  it('round-trips a rich workflow entry without dropping fields', () => {
    const entry = {
      serviceId: 'svc-rt',
      serviceProvider: 'p',
      serviceDetails: { endpoint: 'https://x', namespace: 'n' },
      meta: { description: 'd', attribution: { text: 't' }, units: 'm' },
      data: [{ format: 'cog', zIndex: 5, bands: [1, 2, 3] }],
    };
    const parsed = DataSourceSchema.parse(wrap([entry])) as any;
    const wf = parsed.workflows[0];
    expect(wf.serviceId).toBe('svc-rt');
    expect(wf.serviceDetails.endpoint).toBe('https://x');
    expect(wf.serviceDetails.namespace).toBe('n');
    expect(wf.meta.units).toBe('m');
    expect(wf.data[0].bands).toEqual([1, 2, 3]);
  });
});
