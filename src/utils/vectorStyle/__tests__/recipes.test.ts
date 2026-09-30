import { describe, it, expect } from 'vitest';
import {
  applyRecipeRules,
  buildCategorizedRecipe,
  buildGraduatedRecipe,
  buildHighlightRecipe,
  buildLabelRecipe,
  buildRecipeRules,
  buildUniformRecipe,
  resolveCategoryColors,
} from '../recipes';
import { toFlatStyleArray } from '../toFlatStyleArray';
import type { StyleRule } from '@/types/vectorStyle';

describe('resolveCategoryColors', () => {
  it('assigns palette colours to bare category names', () => {
    const result = resolveCategoryColors(['Forest', 'Urban', 'Water']);
    expect(result.map(r => r.value)).toEqual(['Forest', 'Urban', 'Water']);
    expect(new Set(result.map(r => r.color)).size).toBe(3);
  });

  it('keeps colours the caller already chose', () => {
    const result = resolveCategoryColors([{ value: 'Forest', color: '#001122' }]);
    expect(result[0].color).toBe('#001122');
  });
});

describe('buildCategorizedRecipe', () => {
  it('creates a match-based fill for polygons with a fallback colour', () => {
    const [rule] = buildCategorizedRecipe({
      field: 'landuse',
      categories: ['Forest', 'Urban'],
      geometry: 'polygon',
    });

    const fill = rule.primitives.fill?.props['fill-color'];
    expect(fill).toMatchObject({ kind: 'attribute', field: 'landuse', mode: 'match' });
    if (fill && fill.kind === 'attribute' && fill.mode === 'match') {
      expect(fill.stops.map(s => s.key)).toEqual(['Forest', 'Urban']);
      expect(fill.default).toBeDefined();
    }
    expect(rule.primitives.line).toBeDefined();
  });

  it('colours circle markers for point geometry', () => {
    const [rule] = buildCategorizedRecipe({
      field: 'kind',
      categories: ['A', 'B'],
      geometry: 'point',
    });
    expect(rule.primitives.marker?.props['circle-fill-color']).toBeDefined();
    expect(rule.primitives.fill).toBeUndefined();
  });

  it('colours the stroke for line geometry', () => {
    const [rule] = buildCategorizedRecipe({
      field: 'class',
      categories: ['primary'],
      geometry: 'line',
    });
    expect(rule.primitives.line?.props['stroke-color']).toMatchObject({ kind: 'attribute' });
  });
});

describe('buildGraduatedRecipe', () => {
  it('creates interpolate stops across an equal interval range', () => {
    const [rule] = buildGraduatedRecipe({
      field: 'population',
      geometry: 'polygon',
      classes: 5,
      min: 0,
      max: 100,
    });

    const fill = rule.primitives.fill?.props['fill-color'];
    expect(fill).toMatchObject({ kind: 'attribute', mode: 'interpolate' });
    if (fill && fill.kind === 'attribute' && fill.mode === 'interpolate') {
      expect(fill.stops.map(s => s.input)).toEqual([0, 25, 50, 75, 100]);
    }
  });

  it('uses quantile breaks when asked', () => {
    const [rule] = buildGraduatedRecipe({
      field: 'score',
      geometry: 'polygon',
      classes: 3,
      method: 'quantile',
      values: [1, 2, 3, 40, 100],
    });

    const fill = rule.primitives.fill?.props['fill-color'];
    if (fill && fill.kind === 'attribute' && fill.mode === 'interpolate') {
      expect(fill.stops[0].input).toBe(1);
      expect(fill.stops[fill.stops.length - 1].input).toBe(100);
    }
  });

  it('never produces fewer than two classes', () => {
    const [rule] = buildGraduatedRecipe({
      field: 'x',
      geometry: 'line',
      classes: 1,
      min: 0,
      max: 10,
    });
    const stroke = rule.primitives.line?.props['stroke-color'];
    if (stroke && stroke.kind === 'attribute' && stroke.mode === 'interpolate') {
      expect(stroke.stops.length).toBe(2);
    }
  });
});

describe('buildUniformRecipe', () => {
  it('produces a constant fill and outline for polygons', () => {
    const [rule] = buildUniformRecipe({ geometry: 'polygon', color: '#ff0000' });
    expect(rule.primitives.fill?.props['fill-color']).toMatchObject({ kind: 'constant' });
    expect(rule.primitives.line?.props['stroke-width']).toMatchObject({ kind: 'constant' });
  });

  it.each([
    ['dashed', 3, [12, 6]],
    ['dotted', 2, [2, 4]],
    ['dash-dot', 4, [16, 8, 4, 8]],
    ['long-dash', 6, [48, 18]],
  ] as const)('creates a scaled %s pattern at %d px', (lineStyle, outlineWidth, dashPattern) => {
    const [rule] = buildUniformRecipe({ geometry: 'line', lineStyle, outlineWidth });
    expect(rule.primitives.line?.props['stroke-width']).toEqual({ kind: 'constant', value: outlineWidth });
    expect(rule.primitives.line?.props['stroke-line-dash']).toEqual({ kind: 'constant', value: dashPattern });
  });

  it('uses round caps for dotted lines', () => {
    const [rule] = buildUniformRecipe({ geometry: 'line', lineStyle: 'dotted' });
    expect(rule.primitives.line?.props['stroke-line-cap']).toEqual({ kind: 'constant', value: 'round' });
  });

  it.each([1, 2, 3, 4, 6])('supports the %d px line-weight preset', (outlineWidth) => {
    const [rule] = buildUniformRecipe({ geometry: 'line', outlineWidth });
    expect(rule.primitives.line?.props['stroke-width']).toEqual({ kind: 'constant', value: outlineWidth });
  });

  it('keeps solid lines free of dash and cap properties', () => {
    const [rule] = buildUniformRecipe({ geometry: 'line', lineStyle: 'solid', outlineWidth: 2 });
    expect(rule.primitives.line?.props['stroke-line-dash']).toBeUndefined();
    expect(rule.primitives.line?.props['stroke-line-cap']).toBeUndefined();
  });

  it('serialises line style and weight to standard flat-style properties', () => {
    const rules = buildUniformRecipe({ geometry: 'line', lineStyle: 'dash-dot', outlineWidth: 3 });
    expect(toFlatStyleArray(rules)).toEqual([
      expect.objectContaining({
        'stroke-width': 3,
        'stroke-line-dash': [12, 6, 3, 6],
      }),
    ]);
  });

  it('does not add line-pattern properties to polygon or point recipes', () => {
    for (const geometry of ['polygon', 'point'] as const) {
      const [rule] = buildUniformRecipe({ geometry, lineStyle: 'dashed', outlineWidth: 4 });
      const props = geometry === 'polygon' ? rule.primitives.line?.props : rule.primitives.marker?.props;
      expect(props?.['stroke-line-dash']).toBeUndefined();
      expect(props?.['stroke-line-cap']).toBeUndefined();
    }
  });
});

describe('buildLabelRecipe', () => {
  it('reads the label text from the chosen field', () => {
    const [rule] = buildLabelRecipe({ field: 'name', fontSize: 14, offsetY: -8 });
    expect(rule.primitives.label?.props['text-value']).toEqual({
      kind: 'expression',
      raw: ['get', 'name'],
    });
    expect(rule.primitives.label?.props['text-font']).toEqual({
      kind: 'constant',
      value: '14px sans-serif',
    });
    expect(rule.primitives.label?.props['text-offset-y']).toEqual({
      kind: 'constant',
      value: -8,
    });
  });
});

describe('buildHighlightRecipe', () => {
  it('creates a filtered rule only when no base colour is given', () => {
    const rules = buildHighlightRecipe({
      field: 'status',
      op: '==',
      value: 'critical',
      geometry: 'polygon',
    });
    expect(rules).toHaveLength(1);
    expect(rules[0].filter).toMatchObject({ kind: 'simple' });
  });

  it('adds an else branch when a base colour is given', () => {
    const rules = buildHighlightRecipe({
      field: 'status',
      op: '==',
      value: 'critical',
      geometry: 'polygon',
      baseColor: '#cccccc',
    });
    expect(rules).toHaveLength(2);
    expect(rules[1].else).toBe(true);
  });
});

describe('applyRecipeRules', () => {
  const existing: StyleRule[] = [{ name: 'Existing', enabled: true, primitives: {} }];

  it('replaces existing rules in replace mode', () => {
    const generated = buildUniformRecipe({ geometry: 'polygon' });
    expect(applyRecipeRules(existing, generated, 'replace')).toHaveLength(1);
    expect(applyRecipeRules(existing, generated, 'replace')[0].name).toBe('All features');
  });

  it('keeps existing rules in append mode', () => {
    const generated = buildUniformRecipe({ geometry: 'polygon' });
    const result = applyRecipeRules(existing, generated, 'append');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Existing');
    expect(result[1].name).toBe('All features');
    expect(existing).toHaveLength(1);
  });

  it('appends to an empty style without prompting for a mode', () => {
    const generated = buildUniformRecipe({ geometry: 'line' });
    expect(applyRecipeRules([], generated, 'append')).toEqual(generated);
  });

  it('places new rules before an existing everything-else fallback', () => {
    const fallback: StyleRule = { name: 'Everything else', enabled: true, else: true, primitives: {} };
    const generated = buildUniformRecipe({ geometry: 'polygon' });
    const result = applyRecipeRules([...existing, fallback], generated, 'append');
    expect(result.map((rule) => rule.name)).toEqual(['Existing', 'All features', 'Everything else']);
  });

  it('keeps a single else rule last', () => {
    const generated = buildHighlightRecipe({
      field: 'a',
      op: '==',
      value: 1,
      geometry: 'polygon',
      baseColor: '#eeeeee',
    });
    const result = applyRecipeRules(existing, generated, 'append');
    expect(result[result.length - 1].else).toBe(true);
    expect(result.filter(r => r.else)).toHaveLength(1);
  });
});

describe('recipe output serialises to a flat style array', () => {
  it('round-trips through toFlatStyleArray', () => {
    const rules = buildRecipeRules({
      recipe: 'categorized',
      field: 'landuse',
      categories: ['Forest', 'Urban'],
      geometry: 'polygon',
    });
    const flat = toFlatStyleArray(rules);
    expect(Array.isArray(flat)).toBe(true);
    expect(flat.length).toBeGreaterThan(0);
  });
});
