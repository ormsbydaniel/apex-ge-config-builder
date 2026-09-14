import { describe, it, expect } from 'vitest';
import { detectTopLevelDefaultsNeeded } from '../detection/topLevelDefaultsDetector';
import {
  reverseTopLevelDefaultsTransformation,
  DEFAULT_LOGO_URL,
} from '../transformers/topLevelDefaultsTransformer';
import { normalizeImportedConfig } from '../index';
import { ConfigurationSchema } from '@/schemas/configSchema';

const legacyConfig = () => ({
  version: '1.0.0',
  layout: { navigation: { title: 'Legacy config' } },
  sources: [],
});

describe('top-level defaults transformer', () => {
  it('detects missing logo / exclusivitySets / interfaceGroups', () => {
    expect(detectTopLevelDefaultsNeeded(legacyConfig())).toBe(true);
  });

  it('fills in the default logo when missing', () => {
    const result = reverseTopLevelDefaultsTransformation(legacyConfig(), true);
    expect(result.layout.navigation.logo).toBe(DEFAULT_LOGO_URL);
  });

  it('replaces an invalid logo value', () => {
    const config = { ...legacyConfig() } as any;
    config.layout.navigation.logo = 'not a url';
    const result = reverseTopLevelDefaultsTransformation(config, true);
    expect(result.layout.navigation.logo).toBe(DEFAULT_LOGO_URL);
  });

  it('defaults exclusivitySets and interfaceGroups to empty arrays', () => {
    const result = reverseTopLevelDefaultsTransformation(legacyConfig(), true);
    expect(result.exclusivitySets).toEqual([]);
    expect(result.interfaceGroups).toEqual([]);
  });

  it('leaves a valid config untouched', () => {
    const valid = {
      layout: { navigation: { logo: '/logo.svg', title: 'Valid' } },
      interfaceGroups: ['Group 1'],
      exclusivitySets: ['set-a'],
      sources: [],
    };
    expect(detectTopLevelDefaultsNeeded(valid)).toBe(false);
    const result = reverseTopLevelDefaultsTransformation(valid, true);
    expect(result).toEqual(valid);
  });

  it('makes a legacy config pass schema validation after import normalisation', () => {
    const normalized = normalizeImportedConfig(legacyConfig());
    const parsed = ConfigurationSchema.safeParse(normalized);
    expect(parsed.success).toBe(true);
  });
});
