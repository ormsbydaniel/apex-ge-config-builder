import React from 'react';
import { Image, Leaf, Wheat, Building2, PencilRuler, Loader2, Sprout, Droplet, Waves, Factory, Flame, TreeDeciduous, Calculator } from 'lucide-react';
import { RGB_RECIPES, resolveRecipeBands, type RgbRecipeId } from '@/utils/rgbComposite/recipes';
import { INDEX_RECIPES, resolveIndexBands, type IndexRecipeId } from '@/utils/rgbComposite/indices';
import { createGradientCSS } from '@/utils/colormapUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const RECIPE_ICONS: Record<RgbRecipeId, React.ComponentType<{ className?: string }>> = {
  natural: Image,
  'false-colour-ir': Leaf,
  agriculture: Wheat,
  geology: Building2,
  custom: PencilRuler,
};

export const INDEX_ICONS: Record<IndexRecipeId, React.ComponentType<{ className?: string }>> = {
  ndvi: Sprout,
  ndwi: Droplet,
  mndwi: Waves,
  ndbi: Factory,
  nbr: Flame,
  ndre: TreeDeciduous,
  'custom-index': Calculator,
};

interface CompositeGalleryProps {
  bandCount: number;
  bandLabels?: string[];
  loading: boolean;
  onPick: (id: RgbRecipeId) => void;
  onPickIndex: (id: IndexRecipeId) => void;
}

const cardClass =
  'flex w-full items-start gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const sectionLabel = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';
const UNAVAILABLE = 'Not available — this source lacks the required bands or band labels.';

const withTooltip = (key: string, unavailable: boolean, card: React.ReactNode) =>
  !unavailable ? <React.Fragment key={key}>{card}</React.Fragment> : (
    <Tooltip key={key}>
      <TooltipTrigger asChild><span className="block">{card}</span></TooltipTrigger>
      <TooltipContent className="max-w-[240px]"><p>{UNAVAILABLE}</p></TooltipContent>
    </Tooltip>
  );

const CompositeGallery = ({ bandCount, bandLabels, loading, onPick, onPickIndex }: CompositeGalleryProps) => (
  <div className="space-y-5">
    <p className="text-sm text-muted-foreground">
      How do you want this imagery to look? Pick a three-band composite or a spectral index — we'll assign the bands for you, and you can adjust everything afterwards.
    </p>
    {loading ? (
      <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Reading band information…
      </div>
    ) : (
      <TooltipProvider delayDuration={400}>
        <div className="space-y-2">
          <div className={sectionLabel}>RGB composites</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RGB_RECIPES.map((r) => {
              const Icon = RECIPE_ICONS[r.id];
              const bands = resolveRecipeBands(r.id, bandCount, bandLabels);
              const unavailable = r.id !== 'custom' && !bands;
              return withTooltip(r.id, unavailable, (
                <button
                  type="button"
                  className={cn(cardClass, r.id === 'custom' && 'border-dashed', unavailable && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card')}
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
              ));
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className={sectionLabel}>Spectral indices</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INDEX_RECIPES.map((r) => {
              const Icon = INDEX_ICONS[r.id];
              const bands = resolveIndexBands(r.id, bandCount, bandLabels);
              const custom = r.id === 'custom-index';
              const unavailable = !custom && !bands;
              return withTooltip(r.id, unavailable, (
                <button
                  type="button"
                  className={cn(cardClass, custom && 'border-dashed', unavailable && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card')}
                  disabled={unavailable}
                  onClick={() => !unavailable && onPickIndex(r.id)}
                >
                  <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', custom ? 'text-muted-foreground' : 'text-primary')} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-sm font-medium">
                      {r.fullName}
                      {bands && <span className="ml-2 text-xs font-normal text-muted-foreground">{bands.join(' & ')}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{r.formula}</div>
                    {!custom && <div className="h-1.5 rounded-sm" style={{ background: createGradientCSS(r.colormap, r.reverse) }} />}
                  </div>
                </button>
              ));
            })}
          </div>
        </div>
      </TooltipProvider>
    )}
  </div>
);

export default CompositeGallery;
