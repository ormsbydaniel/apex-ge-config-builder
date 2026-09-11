import { describe, it, expect } from 'vitest';
import { configReducer } from '../ConfigContext';

const baseLayer = (name: string, isActive: boolean) => ({
  id: `bl-${name}`,
  name,
  isBaseLayer: true,
  isActive,
  data: [{ url: `https://example.com/${name}`, format: 'xyz', zIndex: 0 }],
});

const makeState = (sources: any[]): any => ({
  sources,
  interfaceGroups: [],
  services: [],
  exclusivitySets: [],
  layout: {},
  isDirty: false,
  validationResults: {},
});

describe('configReducer UPDATE_SOURCES base layer activation', () => {
  it('deactivates the previously active base layer when another is newly activated', () => {
    const state = makeState([baseLayer('A', true), baseLayer('B', false)]);
    const updated = [baseLayer('A', true), baseLayer('B', true)]; // B newly activated

    const result = configReducer(state, { type: 'UPDATE_SOURCES', payload: updated } as any);

    const active = result.sources.filter((s: any) => s.isBaseLayer && s.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('B');
    expect(result.sources[0].isActive).toBe(false);
  });

  it('leaves pure reorders untouched (no newly activated layer)', () => {
    const state = makeState([baseLayer('A', true), baseLayer('B', false)]);
    const reordered = [baseLayer('B', false), baseLayer('A', true)];

    const result = configReducer(state, { type: 'UPDATE_SOURCES', payload: reordered } as any);

    const active = result.sources.filter((s: any) => s.isBaseLayer && s.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('A');
  });
});
