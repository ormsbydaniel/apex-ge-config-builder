import { describe, it, expect } from 'vitest';
import { toFlatStyleArray } from '../toFlatStyleArray';
import { fromFlatStyleArray } from '../fromFlatStyleArray';
import type { StyleRule } from '@/types/vectorStyle';

const constant = (value: any) => ({ kind: 'constant' as const, value });

describe('vector style serialisation', () => {
  it('round-trips a single fill rule with no filter', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        primitives: { fill: { props: { 'fill-color': constant('#ff0000') } } },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([{ 'fill-color': '#ff0000' }]);

    const parsed = fromFlatStyleArray(json);
    expect(parsed.fallbacks).toEqual([]);
    expect(parsed.rules).toEqual(rules);
  });

  it('round-trips a multi-primitive rule with a simple filter', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        name: 'Big cities',
        filter: {
          kind: 'simple',
          combinator: 'all',
          clauses: [{ field: 'pop_max', op: '>', value: 10_000_000 }],
        },
        primitives: {
          marker: {
            subMode: 'circle',
            props: {
              'circle-radius': constant(6),
              'circle-fill-color': constant('#3b82f6'),
            },
          },
          label: {
            props: { 'text-value': { kind: 'expression', raw: ['get', 'name'] } },
          },
        },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([
      {
        filter: ['>', ['get', 'pop_max'], 10_000_000],
        style: {
          _name: 'Big cities',
          'circle-radius': 6,
          'circle-fill-color': '#3b82f6',
          'text-value': ['get', 'name'],
        },
      },
    ]);

    const parsed = fromFlatStyleArray(json);
    expect(parsed.fallbacks).toEqual([]);
    // `['get', 'name']` parses back to the richer attribute form rather than a
    // raw expression, so assert the parsed shape and that it re-serialises 1:1.
    expect(parsed.rules[0].primitives.label?.props['text-value']).toEqual({
      kind: 'attribute',
      field: 'name',
      mode: 'direct',
    });
    expect(parsed.rules[0].name).toBe('Big cities');
    expect(parsed.rules[0].filter).toMatchObject({
      kind: 'simple',
      combinator: 'all',
      clauses: [{ field: 'pop_max', op: '>', value: 10_000_000 }],
    });
    expect(parsed.rules[0].primitives.marker).toEqual({
      subMode: 'circle',
      props: {
        'circle-radius': constant(6),
        'circle-fill-color': constant('#3b82f6'),
      },
    });
    expect(toFlatStyleArray(parsed.rules)).toEqual(json);
  });

  it('round-trips rules with else branch', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        filter: {
          kind: 'simple',
          combinator: 'all',
          clauses: [{ field: 'kind', op: '==', value: 'major' }],
        },
        primitives: { line: { props: { 'stroke-width': constant(3) } } },
      },
      {
        enabled: true,
        else: true,
        primitives: { line: { props: { 'stroke-width': constant(1) } } },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([
      {
        filter: ['==', ['get', 'kind'], 'major'],
        style: { 'stroke-width': 3 },
      },
      {
        else: true,
        style: { 'stroke-width': 1 },
      },
    ]);

    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules).toEqual(rules);
  });

  it('round-trips zoom-driven interpolate', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        primitives: {
          marker: {
            subMode: 'circle',
            props: {
              'circle-radius': {
                kind: 'zoom',
                mode: 'interpolate',
                interpolation: 'linear',
                stops: [
                  { input: 5, value: 2 },
                  { input: 18, value: 12 },
                ],
              },
            },
          },
        },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([
      {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 18, 12],
      },
    ]);
    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules).toEqual(rules);
  });

  it('round-trips attribute match with default', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        primitives: {
          fill: {
            props: {
              'fill-color': {
                kind: 'attribute',
                field: 'category',
                mode: 'match',
                stops: [
                  { key: 'water', value: '#1565c0' },
                  { key: 'forest', value: '#2e7d32' },
                ],
                default: '#777777',
              },
            },
          },
        },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([
      {
        'fill-color': [
          'match',
          ['get', 'category'],
          'water',
          '#1565c0',
          'forest',
          '#2e7d32',
          '#777777',
        ],
      },
    ]);
    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules).toEqual(rules);
  });

  it('parses unknown expression as fallback and round-trips it', () => {
    const json = [
      {
        'text-value': ['concat', ['get', 'a'], ', ', ['get', 'b']],
      },
    ];
    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules[0].primitives.label?.props['text-value']).toEqual({
      kind: 'expression',
      raw: ['concat', ['get', 'a'], ', ', ['get', 'b']],
    });
    const reSerialised = toFlatStyleArray(parsed.rules);
    expect(reSerialised).toEqual(json);
  });

  it('omits disabled rules from output', () => {
    const rules: StyleRule[] = [
      {
        enabled: false,
        primitives: { fill: { props: { 'fill-color': constant('#000000') } } },
      },
      {
        enabled: true,
        primitives: { fill: { props: { 'fill-color': constant('#ff0000') } } },
      },
    ];
    expect(toFlatStyleArray(rules)).toEqual([{ 'fill-color': '#ff0000' }]);
  });

  it('preserves bare style objects on parse', () => {
    const json = [{ 'stroke-color': '#000', 'stroke-width': 1 }];
    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules).toHaveLength(1);
    expect(parsed.rules[0].primitives.line?.props).toEqual({
      'stroke-color': constant('#000'),
      'stroke-width': constant(1),
    });
  });

  it('reports fallback for unknown property keys', () => {
    const json = [{ 'mystery-prop': 1 }];
    const parsed = fromFlatStyleArray(json);
    expect(parsed.fallbacks.length).toBeGreaterThan(0);
    expect(parsed.fallbacks[0].property).toBe('mystery-prop');
  });

  it('round-trips combinator filters', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        filter: {
          kind: 'simple',
          combinator: 'any',
          clauses: [
            { field: 'pop', op: '>=', value: 1000 },
            { field: 'capital', op: '==', value: true },
          ],
        },
        primitives: { fill: { props: { 'fill-color': constant('#abc') } } },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([
      {
        filter: [
          'any',
          ['>=', ['get', 'pop'], 1000],
          ['==', ['get', 'capital'], true],
        ],
        style: { 'fill-color': '#abc' },
      },
    ]);
    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules).toEqual(rules);
  });

  it('round-trips zoom pseudo-field in filter', () => {
    const rules: StyleRule[] = [
      {
        enabled: true,
        filter: {
          kind: 'simple',
          combinator: 'all',
          clauses: [{ field: 'zoom', isZoom: true, op: '>=', value: 8 }],
        },
        primitives: { line: { props: { 'stroke-width': constant(1) } } },
      },
    ];
    const json = toFlatStyleArray(rules);
    expect(json).toEqual([
      {
        filter: ['>=', ['zoom'], 8],
        style: { 'stroke-width': 1 },
      },
    ]);
    const parsed = fromFlatStyleArray(json);
    expect(parsed.rules).toEqual(rules);
  });
});
