import { describe, it, expect } from 'vitest';
import { removeInvalidSources, allErrorsAreSourceScoped } from '../removeInvalidSources';
import { autoFixConfig } from '../autoFix';
import type { ValidationErrorDetails } from '@/types/config';

const err = (path: (string | number)[]): ValidationErrorDetails => ({
  field: path.join('.'),
  message: 'bad',
  code: 'invalid_union',
  path,
});

describe('removeInvalidSources', () => {
  it('drops only the flagged sources', () => {
    const cfg = { sources: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] };
    const { config, removed } = removeInvalidSources(cfg, [err(['sources', 1])]);
    expect(config.sources.map((s: any) => s.name)).toEqual(['A', 'C']);
    expect(removed).toEqual([{ index: 1, name: 'B' }]);
  });

  it('detects source-scoped errors', () => {
    expect(allErrorsAreSourceScoped([err(['sources', 0, 'meta'])])).toBe(true);
    expect(allErrorsAreSourceScoped([err(['layout'])])).toBe(false);
    expect(allErrorsAreSourceScoped([])).toBe(false);
  });
});

describe('autoFixConfig', () => {
  it('fills missing base-layer meta fields', () => {
    const cfg = {
      sources: [
        {
          name: 'OSM',
          isBaseLayer: true,
          meta: {},
          data: [{ url: 'x', format: 'xyz', zIndex: 0 }],
        },
      ],
    };
    const { config, appliedFixes } = autoFixConfig(cfg, [err(['sources', 0])]);
    expect(config.sources[0].meta.description).toBeTruthy();
    expect(config.sources[0].meta.attribution.text).toBeTruthy();
    expect(appliedFixes.length).toBeGreaterThan(0);
  });

  it('adds minimal layout for layer cards missing layout', () => {
    const cfg = {
      interfaceGroups: ['Group A'],
      sources: [
        {
          name: 'Layer',
          meta: { description: 'd', attribution: { text: 't' } },
          data: [{ url: 'x', format: 'geojson', zIndex: 1 }],
        },
      ],
    };
    const { config } = autoFixConfig(cfg, [err(['sources', 0])]);
    expect(config.sources[0].layout.interfaceGroup).toBe('Group A');
  });

  it('does not modify unflagged sources', () => {
    const cfg = {
      sources: [
        { name: 'Clean', meta: { description: 'd', attribution: { text: 't' } } },
        { name: 'Broken', isBaseLayer: true, meta: {} },
      ],
    };
    const { config } = autoFixConfig(cfg, [err(['sources', 1])]);
    expect(config.sources[0]).toBe(cfg.sources[0]);
  });
});
