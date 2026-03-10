import React, { useState } from 'react';
import { Eye, Tags, Palette, LayoutGrid, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { DataSource } from '@/types/config';
import { DataSourceMeta } from '@/types/layer';
import { Category, Colormap } from '@/types/category';
import ColorRampPreview from '@/components/ui/ColorRampPreview';
import CategoryEditorDialog from '@/components/form/CategoryEditorDialog';
import ColormapEditorDialog from '@/components/form/ColormapEditorDialog';
import LayerRgbCompositesDisplay from './LayerRgbCompositesDisplay';
import LegendEditorDialog from '@/components/form/LegendEditorDialog';
import { ExternalLink, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DataSourceLayout } from '@/types/layer';

interface LayerDataVisualisationSectionProps {
  source: DataSource;
  onUpdateMeta: (updates: Partial<DataSourceMeta>) => void;
  onUpdateLayout: (updates: Partial<DataSourceLayout>) => void;
}

const LayerDataVisualisationSection = ({ source, onUpdateMeta, onUpdateLayout }: LayerDataVisualisationSectionProps) => {
  const [rgbDialogOpen, setRgbDialogOpen] = useState(false);
  const [legendDialogOpen, setLegendDialogOpen] = useState(false);
  const categories = source.meta?.categories || [];
  const colormaps = source.meta?.colormaps || [];
  const legend = source.layout?.layerCard?.legend || source.layout?.infoPanel?.legend;
  const rgbComposites = source.meta?.rgbComposites || [];

  const hasCategories = categories.length > 0;
  const hasColormaps = colormaps.length > 0;
  const hasLegend = !!legend;
  const hasRgbComposites = rgbComposites.length > 0;
  const hasValues = categories.some(cat => cat.value !== undefined);

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Data Visualisation</h4>
      </div>

      <div className="ml-6 space-y-4">
        {/* Categories sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tags className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[130px]">
              Categories {hasCategories ? `(${categories.length})` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            <CategoryEditorDialog
              categories={categories}
              onUpdate={(cats) => onUpdateMeta({ categories: cats })}
              layerName={source.name}
              trigger={
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Pencil className="h-3 w-3" />
                </Button>
              }
            />
          </div>
          {hasCategories && (
            <div className="flex flex-wrap gap-1">
              {categories.map((cat, catIndex) => (
                <Badge key={catIndex} variant="outline" className="text-[11px] font-normal text-muted-foreground border-border/50 py-0 px-1.5">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                  {hasValues && cat.value !== undefined && (
                    <span className="text-xs text-muted-foreground ml-1">({cat.value})</span>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Colormaps sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[130px]">
              Colormaps {hasColormaps ? `(${colormaps.length})` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            <ColormapEditorDialog
              colormaps={colormaps}
              onUpdate={(cmaps) => onUpdateMeta({ colormaps: cmaps })}
              metaMin={source.meta?.min}
              metaMax={source.meta?.max}
              trigger={
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Pencil className="h-3 w-3" />
                </Button>
              }
            />
          </div>
          {hasColormaps && (
            <div className="flex flex-wrap gap-2">
              {colormaps.map((colormap, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-2 px-2 py-0.5 border-border/50">
                  <ColorRampPreview
                    colormap={colormap.name}
                    reverse={colormap.reverse}
                    width={50}
                    height={14}
                  />
                  <div className="flex flex-col text-[11px]">
                    <span className="font-normal text-muted-foreground">{colormap.name}</span>
                    <span className="text-muted-foreground/70">
                      {colormap.min}-{colormap.max} ({colormap.steps} steps)
                      {colormap.reverse && ' • reversed'}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete colormap ${colormap.name}`}
                    onClick={() => onUpdateMeta({ colormaps: colormaps.filter((_, i) => i !== index) })}
                    className="ml-1 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* RGB Composites sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[130px]">
              RGB Composites {hasRgbComposites ? `(${rgbComposites.length})` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setRgbDialogOpen(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          {hasRgbComposites && (
            <div className="ml-5">
              <LayerRgbCompositesDisplay rgbComposites={rgbComposites} />
            </div>
          )}

          <Dialog open={rgbDialogOpen} onOpenChange={setRgbDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>RGB Composites Editor</DialogTitle>
                <DialogDescription>
                  RGB Composite editing functionality is coming soon. Stay tuned!
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        {/* Legend sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[130px]">
              Legend {hasLegend ? `- ${legend.type}` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setLegendDialogOpen(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>

          <LegendEditorDialog
            open={legendDialogOpen}
            onOpenChange={setLegendDialogOpen}
            legend={legend?.type ? legend as { type: 'swatch' | 'gradient' | 'image'; url?: string } : undefined}
            meta={source.meta}
            onUpdateLegend={(updatedLegend) => {
              onUpdateLayout({
                layerCard: {
                  ...source.layout?.layerCard,
                  legend: updatedLegend,
                },
              });
            }}
            onUpdateMeta={onUpdateMeta}
          />
          {hasLegend && (
            <div className="ml-5">
              {legend.type === 'image' && legend.url && (
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <a
                    href={legend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1 text-sm"
                  >
                    View Legend Image
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {legend.type === 'gradient' && source.meta && (
                <div className="space-y-1">
                  <div
                    className="h-4 rounded border"
                    style={{
                      background: `linear-gradient(to right, ${source.meta.startColor}, ${source.meta.endColor})`
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{source.meta.min}</span>
                    <span>{source.meta.max}</span>
                  </div>
                </div>
              )}
              {legend.type === 'swatch' && (
                <span className="text-sm text-muted-foreground">See categories</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerDataVisualisationSection;
