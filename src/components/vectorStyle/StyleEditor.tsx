import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, Palette, PencilRuler, Square, TrendingUp, Type } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RuleListPane from './RuleListPane';
import RuleEditorPane from './RuleEditorPane';
import type { StyleRule } from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';
import { RECIPES, type RecipeId } from '@/utils/vectorStyle/recipes';

interface StyleEditorProps {
  rules: StyleRule[];
  onChange: (next: StyleRule[]) => void;
  fields: VectorFieldDescriptor[];
  fallbackCount?: number;
  onPickRecipe: (id: RecipeId) => void;
  onRulesEmpty: () => void;
  /** Ask the editor to select (and scroll to) a rule, e.g. one just created by a recipe. */
  focusRule?: { index: number; nonce: number } | null;
}

const RECIPE_ICONS = { categorized: Palette, graduated: TrendingUp, uniform: Square, labels: Type, highlight: Filter };

const AddAnother = ({ onPickRecipe, onScratch }: { onPickRecipe: (id: RecipeId) => void; onScratch: () => void }) => (
  <TooltipProvider delayDuration={400}>
    <div className="border-t pt-3 space-y-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Add another rule</p>
      {RECIPES.map((recipe) => {
        const Icon = RECIPE_ICONS[recipe.id];
        return (
          <Tooltip key={recipe.id}>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm"
                className="w-full h-8 justify-start px-2 text-xs font-normal" onClick={() => onPickRecipe(recipe.id)}>
                <Icon className="h-4 w-4 mr-2 text-primary" />{recipe.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-64">{recipe.description}</TooltipContent>
          </Tooltip>
        );
      })}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="w-full h-8 justify-start px-2 text-xs font-normal"
            onClick={onScratch}>
            <PencilRuler className="h-4 w-4 mr-2 text-muted-foreground" />Start from scratch
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-64">Build a blank rule by hand in the rule editor.</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);

const StyleEditor = ({ rules, onChange, fields, fallbackCount = 0, onPickRecipe, onRulesEmpty, focusRule }: StyleEditorProps) => {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (selected > rules.length - 1) setSelected(Math.max(0, rules.length - 1));
  }, [rules.length, selected]);
  useEffect(() => {
    if (focusRule && focusRule.index <= rules.length - 1) setSelected(focusRule.index);
  }, [focusRule]); // eslint-disable-line react-hooks/exhaustive-deps
  const updateRule = (idx: number, next: StyleRule) =>
    onChange(rules.map((r, i) => (i === idx ? next : r)));

  const removeRule = (idx: number) => {
    const next = rules.filter((_, i) => i !== idx);
    onChange(next);
    if (next.length === 0) onRulesEmpty();
    setSelected((s) => Math.max(0, s > idx ? s - 1 : s === idx ? Math.min(idx, rules.length - 2) : s));
  };

  const duplicateRule = (idx: number) => {
    const copy = JSON.parse(JSON.stringify(rules[idx])) as StyleRule;
    if (copy.name) copy.name = `${copy.name} copy`;
    const nonFallbackRules = rules.filter((rule) => !rule.else);
    const fallbackRules = rules.filter((rule) => rule.else);
    // A fallback cannot be duplicated as another fallback: only one `else`
    // branch is meaningful. Make its copy a normal top rule instead.
    if (copy.else) delete copy.else;
    onChange([copy, ...nonFallbackRules, ...fallbackRules]);
    setSelected(0);
  };

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules.length || from === to) return;
    const next = [...rules];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    // Keep the moved rule selected.
    setSelected((s) => (s === from ? to : from < s && to >= s ? s - 1 : from > s && to <= s ? s + 1 : s));
  };

  const addRule = () => {
    onChange([{ enabled: true, primitives: {} }, ...rules]);
    setSelected(0);
  };

  if (rules.length === 0) {
    return (
      <div className="w-full max-w-xs">
        <p className="text-sm text-muted-foreground mb-3">No style rules yet.</p>
        <AddAnother onPickRecipe={onPickRecipe} onScratch={addRule} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fallbackCount > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-2 text-xs">
          {fallbackCount} item{fallbackCount === 1 ? '' : 's'} opened in expression mode — they couldn't be mapped to a structured form, but will save back unchanged.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(230px,32%)_minmax(0,1fr)] gap-3 min-h-[420px]">
        <div className="space-y-3 md:border-r md:pr-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Rules — drawn top to bottom
          </p>
          <div className="max-h-48 overflow-y-auto pr-1">
            <RuleListPane
              rules={rules}
              selected={Math.min(selected, rules.length - 1)}
              onSelect={setSelected}
              onMove={moveRule}
              onDuplicate={duplicateRule}
              onRemove={removeRule}
            />
          </div>
          <div className="pt-4">
            <AddAnother onPickRecipe={onPickRecipe} onScratch={addRule} />
          </div>
        </div>
        <div className="min-w-0">
          {rules[Math.min(selected, rules.length - 1)] && (
            <RuleEditorPane
              index={Math.min(selected, rules.length - 1)}
              rule={rules[Math.min(selected, rules.length - 1)]}
              onChange={(next) => updateRule(Math.min(selected, rules.length - 1), next)}
              fields={fields}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
