import React from 'react';
import { Palette, TrendingUp, Square, Type, Filter, PencilRuler } from 'lucide-react';
import { RECIPES, type RecipeId } from '@/utils/vectorStyle/recipes';
import { cn } from '@/lib/utils';

const ICONS: Record<RecipeId, React.ComponentType<{ className?: string }>> = {
  categorized: Palette,
  graduated: TrendingUp,
  uniform: Square,
  labels: Type,
  highlight: Filter,
};

interface RecipeGalleryProps {
  onPick: (id: RecipeId) => void;
  onScratch: () => void;
  hasExistingRules: boolean;
}

const cardClass =
  'flex items-start gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const RecipeGallery = ({ onPick, onScratch, hasExistingRules }: RecipeGalleryProps) => (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground">
      What do you want this layer to show? Pick a recipe and we'll build the style rules for you — you can refine them afterwards.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {RECIPES.map((r) => {
        const Icon = ICONS[r.id];
        return (
          <button key={r.id} type="button" className={cardClass} onClick={() => onPick(r.id)}>
            <Icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.description}</div>
            </div>
          </button>
        );
      })}
      <button type="button" className={cn(cardClass, 'border-dashed')} onClick={onScratch}>
        <PencilRuler className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
        <div>
          <div className="text-sm font-medium">{hasExistingRules ? 'Back to rules' : 'Start from scratch'}</div>
          <div className="text-xs text-muted-foreground">
            {hasExistingRules ? 'Return to the current rules without a recipe.' : 'Build rules by hand in the rule editor.'}
          </div>
        </div>
      </button>
    </div>
  </div>
);

export default RecipeGallery;
