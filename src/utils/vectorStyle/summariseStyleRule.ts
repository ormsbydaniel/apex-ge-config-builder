import type {
  StyleRule,
  ValueModel,
  FilterModel,
  FilterClause,
  ConstantValue,
  RulePrimitives,
} from '@/types/vectorStyle';

export type PrimitiveKind = 'fill' | 'line' | 'marker' | 'label';

export interface RuleSummary {
  name: string;
  enabled: boolean;
  primitiveKinds: PrimitiveKind[];
  dominantKind: PrimitiveKind | undefined;
  /** Resolved paint colour for the dominant kind, or 'data-driven' when not constant. */
  colour: string | 'data-driven' | undefined;
  /** First attribute field driving the dominant primitive's paint (if any). */
  drivingField?: string;
  /** Resolved paint colour for each primitive present in the rule. */
  primitiveColours: Partial<Record<PrimitiveKind, { colour: string | 'data-driven' | undefined; drivingField?: string }>>;
  /** Human-readable filter summary ('always' | 'else' | e.g. "status = 'open'"). */
  filterText: string;
}

const DOMINANCE: PrimitiveKind[] = ['fill', 'line', 'marker', 'label'];

const MARKER_COLOUR_KEYS = ['circle-fill-color', 'icon-color', 'shape-fill-color'];

const COLOUR_KEY_BY_KIND: Record<PrimitiveKind, string[]> = {
  fill: ['fill-color'],
  line: ['stroke-color'],
  marker: MARKER_COLOUR_KEYS,
  label: ['text-fill-color'],
};

const getPrimitiveProps = (
  primitives: RulePrimitives,
  kind: PrimitiveKind,
): Record<string, ValueModel> | undefined => {
  switch (kind) {
    case 'fill':
      return primitives.fill?.props;
    case 'line':
      return primitives.line?.props;
    case 'marker':
      return primitives.marker?.props;
    case 'label':
      return primitives.label?.props;
  }
};

const collectPrimitiveKinds = (primitives: RulePrimitives): PrimitiveKind[] => {
  const out: PrimitiveKind[] = [];
  if (primitives.fill) out.push('fill');
  if (primitives.line) out.push('line');
  if (primitives.marker) out.push('marker');
  if (primitives.label) out.push('label');
  return out;
};

const pickDominant = (kinds: PrimitiveKind[]): PrimitiveKind | undefined => {
  for (const k of DOMINANCE) if (kinds.includes(k)) return k;
  return undefined;
};

const constantToColour = (v: ConstantValue): string | undefined => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length >= 3 && v.every(n => typeof n === 'number')) {
    const [r, g, b, a = 1] = v as number[];
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }
  return undefined;
};

const fieldOf = (model: ValueModel): string | undefined => {
  if (model.kind === 'attribute') return model.field;
  if (model.kind === 'zoom') return 'zoom';
  return undefined;
};

const firstAttributeField = (props: Record<string, ValueModel> | undefined): string | undefined => {
  if (!props) return undefined;
  for (const m of Object.values(props)) {
    const f = fieldOf(m);
    if (f) return f;
  }
  return undefined;
};

const resolveColour = (
  primitives: RulePrimitives,
  kind: PrimitiveKind,
): { colour: string | 'data-driven' | undefined; drivingField?: string } => {
  const props = getPrimitiveProps(primitives, kind);
  if (!props) return { colour: undefined };

  for (const key of COLOUR_KEY_BY_KIND[kind]) {
    const model = props[key];
    if (!model) continue;
    if (model.kind === 'constant') {
      return { colour: constantToColour(model.value) };
    }
    return { colour: 'data-driven', drivingField: fieldOf(model) };
  }

  // No colour property at all — fall back to any attribute-driven prop to signal data-driven.
  const fallbackField = firstAttributeField(props);
  if (fallbackField) return { colour: 'data-driven', drivingField: fallbackField };
  return { colour: undefined };
};

const formatConstant = (v: ConstantValue | ConstantValue[] | undefined): string => {
  if (v === undefined) return '';
  if (Array.isArray(v)) {
    const items = v.slice(0, 3).map(item => formatConstant(item as ConstantValue));
    const suffix = v.length > 3 ? `, +${v.length - 3}` : '';
    return `[${items.join(', ')}${suffix}]`;
  }
  if (typeof v === 'string') return `'${v}'`;
  return String(v);
};

const formatClause = (c: FilterClause): string => {
  const field = c.isZoom ? 'zoom' : c.field;
  if (c.op === 'has') return `has ${field}`;
  return `${field} ${c.op} ${formatConstant(c.value)}`.trim();
};

const formatFilter = (rule: StyleRule): string => {
  if (rule.else) return 'else';
  const f: FilterModel | undefined = rule.filter;
  if (!f) return 'always';
  if (f.kind === 'expression') return 'custom expression';
  if (!f.clauses?.length) return 'always';
  const joiner = f.combinator === 'any' ? ' or ' : ' and ';
  return f.clauses.map(formatClause).join(joiner);
};

export const summariseStyleRule = (rule: StyleRule, index: number): RuleSummary => {
  const kinds = collectPrimitiveKinds(rule.primitives ?? {});
  const dominantKind = pickDominant(kinds);
  const primitiveColours = Object.fromEntries(
    kinds.map(kind => [kind, resolveColour(rule.primitives ?? {}, kind)]),
  ) as RuleSummary['primitiveColours'];
  const { colour, drivingField } = dominantKind
    ? primitiveColours[dominantKind] ?? { colour: undefined, drivingField: undefined }
    : { colour: undefined, drivingField: undefined };

  return {
    name: rule.name?.trim() || `Rule ${index + 1}`,
    enabled: rule.enabled !== false,
    primitiveKinds: kinds,
    dominantKind,
    colour,
    drivingField,
    primitiveColours,
    filterText: formatFilter(rule),
  };
};

export const summariseRules = (rules: StyleRule[]): RuleSummary[] =>
  rules.map((r, i) => summariseStyleRule(r, i));
