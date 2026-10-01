import React from 'react';
import { Image, Leaf, Wheat, Mountain, PencilRuler, Loader2 } from 'lucide-react';
import { RGB_RECIPES, resolveRecipeBands, type RgbRecipeId } from '@/utils/rgbComposite/recipes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ICONS: Record<RgbRecipeId, React.ComponentType<{ className?: string }>> = {
  natural: Image,
  'false-colour-ir': Leaf,
  agriculture: Wheat,
  geology: Mountain,
  custom: PencilRuler,
};

interface CompositeGalleryProps {
  bandCount: number;
  bandLabels?: string[];
  loading: boolean;
  onPick: (id: RgbRecipeId) => void;
}

const cardClass =
  'flex items-start gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const CompositeGallery = ({ bandCount, bandLabels, loading, onPick }: CompositeGalleryProps) => (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground">
      How do you want this imagery to look? Pick a composite and we'll assign the bands for you — you can adjust the ranges afterwards.
    </p>
    {loading ? (
      <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Reading band information…
      </div>
    ) : (
      <TooltipProvider delayDuration={400}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RGB_RECIPES.map((r) => {
            const Icon = ICONS[r.id];
            const bands = resolveRecipeBands(r.id, bandCount, bandLabels);
            const unavailable = r.id !== 'custom' && !bands;
            const card = (
              <button
                key={r.id}
                type="button"
                className={cn(
                  cardClass,
                  r.id === 'custom' && 'border-dashed',
                  unavailable && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card',
                )}
                disabled={unavailable}
                onClick={() => !unavailable && onPick(r.id)}
              >
                <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', r.id === 'custom' ? 'text-muted-foreground' : 'text-primary')} />
                <div>
                  <div className="text-sm font-medium">
                    {r.name}
                    {bands && <span className="ml-2 text-xs font-normal text-muted-foreground">{bands.join('-')}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.description}</div>
                </div>
              </button>
            );
            if (!unavailable) return card;
            return (
              <Tooltip key={r.id}>
                <TooltipTrigger asChild>
                  <span className="block">{card}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px]">
                  <p>Not available — this source lacks the required bands or band labels.</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    )}
  </div>
);

export default CompositeGallery;
