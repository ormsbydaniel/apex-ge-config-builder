import { describe, it, expect } from 'vitest';
import { ChartConfigSchema } from '@/schemas/configSchema';

describe('pixelTimeSeries chart source', () => {
  const chart = {
    title: 'Pixel time series',
    traces: [{ name: 'Land cover class', mode: 'lines+markers' }],
    layout: {
      height: 360,
      xaxis: { title: { text: 'Date' }, type: 'category' },
      yaxis: { title: { text: 'Class value' } },
    },
    sources: [{ type: 'pixelTimeSeries', bandIndex: 0 }],
  };

  it('validates and round-trips with bandIndex intact', () => {
    const result = ChartConfigSchema.safeParse(chart);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sources?.[0].type).toBe('pixelTimeSeries');
    expect(result.data.sources?.[0].bandIndex).toBe(0);
    expect(JSON.parse(JSON.stringify(result.data))).toEqual(chart);
  });

  it('rejects a negative bandIndex', () => {
    const bad = { ...chart, sources: [{ type: 'pixelTimeSeries', bandIndex: -1 }] };
    expect(ChartConfigSchema.safeParse(bad).success).toBe(false);
  });
});
