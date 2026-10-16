import { describe, expect, it } from 'vitest';
import templateJson from '../../../../community-templates/apps/s2-monitor/wizard.json';
import baseConfig from '../../../../community-templates/apps/s2-monitor/config.json';
import { parseCommunityTemplate } from '../communityTemplates';
import { applyPatches } from '../patchEngine';
import { APP_TEMPLATES, AppTemplateParams } from '../templates';
import { TRANSFORMS } from '../helpers';

const builtIn = APP_TEMPLATES.find((t) => t.id === 'stac-monitor')!;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const params = (values: Record<string, string>): AppTemplateParams => ({
  title: 'Crop Watch Bristol',
  center: [-2.5, 51.4],
  zoom: 10,
  values: {
    mission: 's2-c1', collectionUrl: '', asset: 'visual', season: 'summer', year: '2023',
    start: '2025-06-01', end: '2025-08-31', maxCloud: '20', layoutVariant: 'fullscreen', ...values,
  },
});

describe('community STAC monitor template', () => {
  const community = parseCommunityTemplate(clone(templateJson), clone(baseConfig));

  it('is prefixed and marked as community', () => {
    expect(community.id).toBe('community:s2-monitor');
    expect(community.community).toBe(true);
  });

  it.each([
    ['Earth Search, summer 2023, 20% cloud', {}],
    ['legacy collection, winter 2024, no cloud limit', { mission: 's2-l2a', season: 'winter', year: '2024', maxCloud: '100' }],
    ['custom dates', { season: 'custom', start: '2022-04-01', end: '2022-04-30' }],
    ['another collection with a non-visual asset', { mission: 'custom', collectionUrl: 'https://example.com/stac/collections/x', asset: 'red' }],
  ])('builds the same config as the built-in template: %s', (_, v) => {
    const p = params(v as Record<string, string>);
    expect(community.build(p)).toEqual(builtIn.build(p));
  });
});

describe('template checks', () => {
  it('rejects a newer format version', () => {
    expect(() => parseCommunityTemplate({ ...clone(templateJson), formatVersion: 2 }, clone(baseConfig))).toThrow(/newer/);
  });

  it('rejects an unknown helper name', () => {
    const t = clone(templateJson) as Record<string, unknown>;
    t.patches = [{ set: '/exportPrefix', use: 'doSomethingClever' }];
    expect(() => parseCommunityTemplate(t, clone(baseConfig))).toThrow(/unknown helper "doSomethingClever"/);
  });

  it('rejects a patch path missing from the base config', () => {
    const t = clone(templateJson) as Record<string, unknown>;
    t.patches = [{ set: '/layout/missing/title', from: 'title' }];
    expect(() => parseCommunityTemplate(t, clone(baseConfig))).toThrow(/does not exist/);
  });

  it('rejects a base config without sources', () => {
    expect(() => parseCommunityTemplate(clone(templateJson), { layout: {} })).toThrow(/base config/);
  });
});

describe('patch engine', () => {
  const ctx = (values: Record<string, string>) => ({
    params: { title: 'T', center: [0, 0] as [number, number], zoom: 3, values },
    computed: {},
    transforms: TRANSFORMS,
  });

  it('sets, applies conditions and removes without changing the base', () => {
    const base = { a: { b: 1, c: 2 }, list: [1, 2, 3] };
    const out = applyPatches(base, [
      { set: '/a/b', from: 'x' },
      { remove: '/a/c', when: { field: 'x', in: ['yes'] } },
      { set: '/list/1', value: 9 },
    ] as never, ctx({ x: 'yes' }));
    expect(out).toEqual({ a: { b: 'yes' }, list: [1, 9, 3] });
    expect(base).toEqual({ a: { b: 1, c: 2 }, list: [1, 2, 3] });
  });
});
