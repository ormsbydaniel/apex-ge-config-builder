import { describe, it, expect } from 'vitest';
import { summariseStyleRule, summariseRules } from '../summariseStyleRule';
import type { StyleRule } from '@/types/vectorStyle';

const rule = (overrides: Partial<StyleRule>): StyleRule => ({
  primitives: {},
  ...overrides,
});

describe('summariseStyleRule', () => {
  it('returns a default name based on index', () => {
    const s = summariseStyleRule(rule({}), 2);
    expect(s.name).toBe('Rule 3');
    expect(s.enabled).toBe(true);
    expect(s.primitiveKinds).toEqual([]);
    expect(s.dominantKind).toBeUndefined();
    expect(s.filterText).toBe('always');
  });

  it('uses custom name when provided', () => {
    expect(summariseStyleRule(rule({ name: 'Roads' }), 0).name).toBe('Roads');
  });

  it('resolves constant fill colour', () => {
    const s = summariseStyleRule(
      rule({
        primitives: {
          fill: { props: { 'fill-color': { kind: 'constant', value: '#abcdef' } } },
        },
      }),
      0,
    );
    expect(s.dominantKind).toBe('fill');
    expect(s.colour).toBe('#abcdef');
    expect(s.drivingField).toBeUndefined();
  });

  it('flags attribute-driven match fill as data-driven', () => {
    const s = summariseStyleRule(
      rule({
        primitives: {
          fill: {
            props: {
              'fill-color': {
                kind: 'attribute',
                field: 'status',
                mode: 'match',
                stops: [{ key: 'open', value: '#0f0' }],
              },
            },
          },
        },
      }),
      0,
    );
    expect(s.colour).toBe('data-driven');
    expect(s.drivingField).toBe('status');
  });

  it('flags zoom-driven stroke as data-driven', () => {
    const s = summariseStyleRule(
      rule({
        primitives: {
          line: {
            props: {
              'stroke-color': {
                kind: 'zoom',
                mode: 'interpolate',
                stops: [{ input: 0, value: '#000' }],
              },
            },
          },
        },
      }),
      0,
    );
    expect(s.dominantKind).toBe('line');
    expect(s.colour).toBe('data-driven');
    expect(s.drivingField).toBe('zoom');
  });

  it('respects dominance order (fill > line > marker > label)', () => {
    const s = summariseStyleRule(
      rule({
        primitives: {
          line: { props: { 'stroke-color': { kind: 'constant', value: '#111' } } },
          marker: { subMode: 'circle', props: {} },
          fill: { props: { 'fill-color': { kind: 'constant', value: '#222' } } },
          label: { props: {} },
        },
      }),
      0,
    );
    expect(s.dominantKind).toBe('fill');
    expect(s.colour).toBe('#222');
    expect(s.primitiveKinds).toEqual(['fill', 'line', 'marker', 'label']);
  });

  it('handles marker icon/shape colour keys', () => {
    const icon = summariseStyleRule(
      rule({
        primitives: {
          marker: {
            subMode: 'icon',
            props: { 'icon-color': { kind: 'constant', value: '#a00' } },
          },
        },
      }),
      0,
    );
    expect(icon.dominantKind).toBe('marker');
    expect(icon.colour).toBe('#a00');

    const shape = summariseStyleRule(
      rule({
        primitives: {
          marker: {
            subMode: 'shape',
            props: { 'shape-fill-color': { kind: 'constant', value: '#0a0' } },
          },
        },
      }),
      0,
    );
    expect(shape.colour).toBe('#0a0');
  });

  it('formats simple all/any filters', () => {
    const all = summariseStyleRule(
      rule({
        filter: {
          kind: 'simple',
          combinator: 'all',
          clauses: [
            { field: 'type', op: '==', value: 'road' },
            { field: 'lanes', op: '>=', value: 2 },
          ],
        },
      }),
      0,
    );
    expect(all.filterText).toBe("type == 'road' and lanes >= 2");

    const any = summariseStyleRule(
      rule({
        filter: {
          kind: 'simple',
          combinator: 'any',
          clauses: [{ field: 'a', op: '==', value: 1 }, { field: 'b', op: '==', value: 2 }],
        },
      }),
      0,
    );
    expect(any.filterText).toBe('a == 1 or b == 2');
  });

  it('formats has and in clauses', () => {
    expect(
      summariseStyleRule(
        rule({
          filter: {
            kind: 'simple',
            combinator: 'all',
            clauses: [{ field: 'name', op: 'has' }],
          },
        }),
        0,
      ).filterText,
    ).toBe('has name');

    expect(
      summariseStyleRule(
        rule({
          filter: {
            kind: 'simple',
            combinator: 'all',
            clauses: [{ field: 't', op: 'in', value: ['a', 'b', 'c', 'd'] }],
          },
        }),
        0,
      ).filterText,
    ).toBe("t in ['a', 'b', 'c', +1]");
  });

  it('reports else and custom expression filters', () => {
    expect(summariseStyleRule(rule({ else: true }), 0).filterText).toBe('else');
    expect(
      summariseStyleRule(
        rule({ filter: { kind: 'expression', raw: ['==', 1, 1] } }),
        0,
      ).filterText,
    ).toBe('custom expression');
  });

  it('marks disabled rules', () => {
    expect(summariseStyleRule(rule({ enabled: false }), 0).enabled).toBe(false);
  });
});

describe('summariseRules', () => {
  it('returns empty array for empty input', () => {
    expect(summariseRules([])).toEqual([]);
  });

  it('summarises each rule in order', () => {
    const out = summariseRules([rule({ name: 'A' }), rule({ name: 'B' })]);
    expect(out.map(r => r.name)).toEqual(['A', 'B']);
  });
});
