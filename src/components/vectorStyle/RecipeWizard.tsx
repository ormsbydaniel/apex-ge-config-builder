import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  buildRecipeRules,
  getRecipe,
  type ClassificationMethod,
  type GeometryTarget,
  type RecipeId,
} from '@/utils/vectorStyle/recipes';
import {
  CATEGORICAL_PALETTES,
  RAMP_PALETTES,
  assignCategoricalColors,
} from '@/utils/vectorStyle/palettes';
import type { FieldSample, SourceSample } from '@/utils/vectorStyle/sampleSourceData';
import type { FilterOperator, StyleRule } from '@/types/vectorStyle';

interface RecipeWizardProps {
  recipe: RecipeId;
  sample: SourceSample | undefined;
  sampling: boolean;
  /** Field names known from config, used when sampling fails. */
  fallbackFields: string[];
  onBack: () => void;
  backLabel?: string;
  onApply: (rules: StyleRule[]) => void;
}

const GEOMETRIES: { id: GeometryTarget; label: string }[] = [
  { id: 'polygon', label: 'Polygons' },
  { id: 'line', label: 'Lines' },
  { id: 'point', label: 'Points' },
];

const OPS: { id: FilterOperator; label: string }[] = [
  { id: '==', label: 'equals' },
  { id: '!=', label: 'is not' },
  { id: '>', label: 'greater than' },
  { id: '>=', label: 'at least' },
  { id: '<', label: 'less than' },
  { id: '<=', label: 'at most' },
];

const Swatches = ({ colors }: { colors: string[] }) => (
  <span className="inline-flex h-3 overflow-hidden rounded-sm border">
    {colors.map((c, i) => (
      <span key={i} className="w-3 h-3" style={{ backgroundColor: c }} />
    ))}
  </span>
);

const typeBadge = (f?: FieldSample) =>
  f ? (f.type === 'number' ? '123' : f.type === 'string' ? 'abc' : f.type) : '';

const RecipeWizard = ({ recipe, sample, sampling, fallbackFields, onBack, backLabel = 'Recipes', onApply }: RecipeWizardProps) => {
  const def = getRecipe(recipe)!;
  const sampled = sample?.fields ?? [];
  const sampleFailed = !sampling && (!sample || !!sample.error || sampled.length === 0);

  const fieldOptions = useMemo(() => {
    let list = sampled;
    if (def.requires === 'number') list = sampled.filter((f) => f.type === 'number');
    if (def.requires === 'category') list = sampled.filter((f) => f.type === 'string' || f.type === 'number' || f.type === 'boolean');
    const names = list.map((f) => f.name);
    if (sampleFailed) fallbackFields.forEach((n) => !names.includes(n) && names.push(n));
    return names;
  }, [sampled, def.requires, sampleFailed, fallbackFields]);

  const [geometry, setGeometry] = useState<GeometryTarget>('polygon');
  const [field, setField] = useState('');
  const [palette, setPalette] = useState(recipe === 'graduated' ? RAMP_PALETTES[0].id : CATEGORICAL_PALETTES[0].id);
  const [categoriesText, setCategoriesText] = useState('');
  const [classes, setClasses] = useState(5);
  const [method, setMethod] = useState<ClassificationMethod>('equal-interval');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [outline, setOutline] = useState('#1e3a8a');
  const [op, setOp] = useState<FilterOperator>('==');
  const [value, setValue] = useState('');
  const [dimOthers, setDimOthers] = useState(true);

  const fieldSample = sampled.find((f) => f.name === field);

  // Pick a sensible default field once options are known.
  useEffect(() => {
    if (!field && fieldOptions.length) setField(fieldOptions[0]);
  }, [fieldOptions, field]);

  // Seed categories / range from the sample when the field changes.
  useEffect(() => {
    if (!fieldSample) return;
    if (fieldSample.categories) setCategoriesText(fieldSample.categories.map((c) => c.value).join('\n'));
    if (fieldSample.numeric) {
      setMin(String(fieldSample.numeric.min));
      setMax(String(fieldSample.numeric.max));
    }
  }, [fieldSample]);

  const categories = categoriesText.split('\n').map((s) => s.trim()).filter(Boolean);
  const needsField = recipe !== 'uniform';
  const canApply =
    (!needsField || !!field) &&
    (recipe !== 'categorized' || categories.length > 0) &&
    (recipe !== 'graduated' || (min !== '' && max !== '' && Number(max) > Number(min)));

  const apply = () => {
    const parseValue = (v: string) => (v !== '' && !isNaN(Number(v)) ? Number(v) : v);
    let rules: StyleRule[] = [];
    switch (recipe) {
      case 'categorized':
        rules = buildRecipeRules({ recipe, field, geometry, categories, paletteId: palette });
        break;
      case 'graduated':
        rules = buildRecipeRules({
          recipe, field, geometry, classes, method, paletteId: palette,
          min: Number(min), max: Number(max), values: fieldSample?.numeric?.values,
        });
        break;
      case 'uniform':
        rules = buildRecipeRules({ recipe, geometry, color, outlineColor: outline });
        break;
      case 'labels':
        rules = buildRecipeRules({ recipe, field, placement: geometry === 'line' ? 'line' : undefined });
        break;
      case 'highlight':
        rules = buildRecipeRules({
          recipe, field, geometry, op, value: parseValue(value),
          highlightColor: color, baseColor: dimOthers ? '#9ca3af' : undefined,
        });
        break;
    }
    onApply(rules);
  };

  const catPreview = assignCategoricalColors(Math.min(categories.length, 20), palette);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-7 px-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {backLabel}
        </Button>
        <div>
          <div className="text-sm font-medium">{def.name}</div>
          <div className="text-xs text-muted-foreground">{def.description}</div>
        </div>
      </div>

      {sampling && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Reading attributes from the layer's first data file…
        </div>
      )}
      {sampleFailed && needsField && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-2 text-xs">
          Couldn't read attributes from the data{sample?.error ? ` (${sample.error})` : ''}. Type the field name and values yourself.
        </div>
      )}

      <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-3 items-center">
        {recipe !== 'labels' && (
          <>
            <Label className="text-xs">Geometry</Label>
            <Select value={geometry} onValueChange={(v) => setGeometry(v as GeometryTarget)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GEOMETRIES.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}

        {needsField && (
          <>
            <Label className="text-xs">Field</Label>
            {fieldOptions.length > 0 ? (
              <Select value={field} onValueChange={setField}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Choose a field" /></SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((n) => (
                    <SelectItem key={n} value={n}>
                      <span className="font-mono text-xs">{n}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">{typeBadge(sampled.find((f) => f.name === n))}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input className="h-8 font-mono text-xs" value={field} onChange={(e) => setField(e.target.value)} placeholder="field_name" />
            )}
          </>
        )}

        {(recipe === 'categorized' || recipe === 'graduated') && (
          <>
            <Label className="text-xs">Palette</Label>
            <Select value={palette} onValueChange={setPalette}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(recipe === 'graduated' ? RAMP_PALETTES : CATEGORICAL_PALETTES).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="inline-flex items-center gap-2"><Swatches colors={p.colors} /> {p.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {recipe === 'categorized' && (
          <>
            <Label className="text-xs self-start pt-2">
              Categories
              <span className="block font-normal text-muted-foreground">one per line</span>
            </Label>
            <div className="space-y-1">
              <Textarea rows={6} className="font-mono text-xs" value={categoriesText} onChange={(e) => setCategoriesText(e.target.value)} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Swatches colors={catPreview} /> {categories.length} value{categories.length === 1 ? '' : 's'}
                {fieldSample?.categoriesTruncated && ' — more values exist; unlisted ones use the fallback colour'}
              </div>
            </div>
          </>
        )}

        {recipe === 'graduated' && (
          <>
            <Label className="text-xs">Range</Label>
            <div className="flex items-center gap-2">
              <Input className="h-8 w-28" type="number" value={min} onChange={(e) => setMin(e.target.value)} />
              <span className="text-xs text-muted-foreground">to</span>
              <Input className="h-8 w-28" type="number" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
            <Label className="text-xs">Classes</Label>
            <div className="flex items-center gap-2">
              <Input className="h-8 w-20" type="number" min={2} max={12} value={classes} onChange={(e) => setClasses(Math.max(2, Math.min(12, Number(e.target.value) || 2)))} />
              <Select value={method} onValueChange={(v) => setMethod(v as ClassificationMethod)}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal-interval">Equal interval</SelectItem>
                  <SelectItem value="quantile" disabled={!fieldSample?.numeric?.values?.length}>Quantile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {recipe === 'highlight' && (
          <>
            <Label className="text-xs">Condition</Label>
            <div className="flex items-center gap-2">
              <Select value={op} onValueChange={(v) => setOp(v as FilterOperator)}>
                <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldSample?.categories?.length ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="value" /></SelectTrigger>
                  <SelectContent>
                    {fieldSample.categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="h-8" value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" />
              )}
            </div>
            <Label className="text-xs">Other features</Label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={dimOthers} onChange={(e) => setDimOthers(e.target.checked)} />
              Show them in grey (otherwise hidden)
            </label>
          </>
        )}

        {(recipe === 'uniform' || recipe === 'highlight') && (
          <>
            <Label className="text-xs">{recipe === 'highlight' ? 'Highlight colour' : 'Colour'}</Label>
            <input type="color" className="h-8 w-16 rounded border" value={color} onChange={(e) => setColor(e.target.value)} />
          </>
        )}
        {recipe === 'uniform' && geometry !== 'line' && (
          <>
            <Label className="text-xs">Outline</Label>
            <input type="color" className="h-8 w-16 rounded border" value={outline} onChange={(e) => setOutline(e.target.value)} />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={apply} disabled={!canApply}>Create rules</Button>
      </div>
    </div>
  );
};

export default RecipeWizard;
