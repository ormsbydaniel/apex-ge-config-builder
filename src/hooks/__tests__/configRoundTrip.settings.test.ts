import { describe, it, expect } from 'vitest';
import { ConfigurationSchema } from '@/schemas/configSchema';

const baseConfig = {
  version: '1.0.0',
  exportPrefix: 'config',
  layout: {
    navigation: {
      logo: 'https://example.com/logo.svg',
      title: 'Test config',
    },
  },
  interfaceGroups: ['Group 1'],
  exclusivitySets: [],
  services: [],
  sources: [],
};

describe('top-level settings block', () => {
  it('accepts settings.layerFetchTimeoutMs and preserves the value', () => {
    const result = ConfigurationSchema.safeParse({
      ...baseConfig,
      settings: { layerFetchTimeoutMs: 5000 },
    });
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
    expect((result as any).data.settings.layerFetchTimeoutMs).toBe(5000);
  });

  it('preserves unknown keys inside settings', () => {
    const parsed = ConfigurationSchema.parse({
      ...baseConfig,
      settings: { layerFetchTimeoutMs: 1000, futureOption: 'keep-me' },
    }) as any;
    expect(parsed.settings.futureOption).toBe('keep-me');
  });

  it('remains valid when settings is absent', () => {
    const parsed = ConfigurationSchema.parse(baseConfig) as any;
    expect(parsed.settings).toBeUndefined();
  });

  it('rejects a non-positive or non-integer timeout', () => {
    expect(
      ConfigurationSchema.safeParse({ ...baseConfig, settings: { layerFetchTimeoutMs: -1 } }).success,
    ).toBe(false);
    expect(
      ConfigurationSchema.safeParse({ ...baseConfig, settings: { layerFetchTimeoutMs: 1.5 } }).success,
    ).toBe(false);
  });
});
