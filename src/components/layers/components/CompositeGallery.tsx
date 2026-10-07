import React from 'react';
import { Image, Leaf, Wheat, Building2, PencilRuler, Loader2, Sprout, Droplet, Waves, Factory, Flame, TreeDeciduous, Calculator } from 'lucide-react';
import { RGB_RECIPES, resolveRecipeBands, type RgbRecipeId } from '@/utils/rgbComposite/recipes';
import { INDEX_RECIPES, paletteGradient, recipePalette, resolveIndexBands, type IndexRecipeId } from '@/utils/rgbComposite/indices';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COMPUTED_NAME, COMPUTED_DESCRIPTION } from '@/utils/rgbComposite/computed';

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
  activeTab: 'rgb' | 'index' | 'computed';
  onTabChange: (tab: 'rgb' | 'index' | 'computed') => void;
  onPick: (id: RgbRecipeId) => void;
  onPickIndex: (id: IndexRecipeId) => void;
  onPickComputed?: () => void;
  /** Show the experimental Computed Composites tab. */
  showComputed?: boolean;
}

const cardClass =
  'h-auto min-h-20 w-full items-start justify-start gap-3 rounded-md border bg-card p-3 text-left font-normal whitespace-normal transition-colors hover:border-primary hover:bg-accent';
const UNAVAILABLE = 'Not available — this source lacks the required bands or band labels.';

const withTooltip = (key: string, unavailable: boolean, card: React.ReactNode) =>
  !unavailable ? <React.Fragment key={key}>{card}</React.Fragment> : (
    <Tooltip key={key}>
      <TooltipTrigger asChild><span className="block">{card}</span></TooltipTrigger>
      <TooltipContent className="max-w-[240px]"><p>{UNAVAILABLE}</p></TooltipContent>
    </Tooltip>
  );

const CompositeGallery = ({ bandCount, bandLabels, loading, activeTab, onTabChange, onPick, onPickIndex, onPickComputed, showComputed = true }: CompositeGalleryProps) => (
  <Tabs value={!showComputed && activeTab === 'computed' ? 'rgb' : activeTab} onValueChange={(value) => onTabChange(value as 'rgb' | 'index' | 'computed')} className="space-y-4">
    <TabsList aria-label="Visualisation type">
      <TabsTrigger value="rgb">Composites</TabsTrigger>
      <TabsTrigger value="index">Indices</TabsTrigger>
      {showComputed && <TabsTrigger value="computed">Computed Composites</TabsTrigger>}
    </TabsList>
    {loading ? (
      <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Reading band information…
      </div>
    ) : (
      <TooltipProvider delayDuration={400}>
        {showComputed && <TabsContent value="computed" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button type="button" variant="outline" className={cardClass} onClick={onPickComputed}>
              <Calculator className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-medium">{COMPUTED_NAME}</div>
                <div className="text-xs text-muted-foreground">{COMPUTED_DESCRIPTION}</div>
                <div className="text-[11px] font-mono text-muted-foreground">R: 2.5 × BSI · G: NIR · B: SWIR1</div>
              </div>
            </Button>
          </div>
        </TabsContent>}
        <TabsContent value="rgb" className="space-y-3">
          <p className="text-sm text-muted-foreground">Choose how three bands combine into a colour image.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RGB_RECIPES.map((r) => {
              const Icon = RECIPE_ICONS[r.id];
              const bands = resolveRecipeBands(r.id, bandCount, bandLabels);
              const unavailable = r.id !== 'custom' && !bands;
              return withTooltip(r.id, unavailable, (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(cardClass, r.id === 'custom' && 'border-dashed', unavailable && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card')}
                  disabled={unavailable}
                  onClick={() => !unavailable && onPick(r.id)}
                >
                  <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', r.id === 'custom' ? 'text-muted-foreground' : 'text-primary')} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {r.name}
                      {bands && <span className="ml-2 text-xs font-normal text-muted-foreground">{bands.join('-')}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                  </div>
                </Button>
              ));
            })}
          </div>
        </TabsContent>

        <TabsContent value="index" className="space-y-3">
          <p className="text-sm text-muted-foreground">Calculate an index from two bands and display it with a colour ramp.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INDEX_RECIPES.map((r) => {
              const Icon = INDEX_ICONS[r.id];
              const bands = resolveIndexBands(r.id, bandCount, bandLabels);
              const palette = recipePalette(r.id);
              const custom = r.id === 'custom-index';
              const unavailable = !custom && !bands;
              return withTooltip(r.id, unavailable, (
                <Button
                  type="button"
                  variant="outline"
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
                    {palette && (
                      <div
                        data-testid={`index-gradient-${r.id}`}
                        className="h-1.5 rounded-sm"
                        style={{ background: paletteGradient(palette.stops) }}
                      />
                    )}
                  </div>
                </Button>
              ));
            })}
          </div>
        </TabsContent>
      </TooltipProvider>
    )}
  </Tabs>
);

export default CompositeGallery;
