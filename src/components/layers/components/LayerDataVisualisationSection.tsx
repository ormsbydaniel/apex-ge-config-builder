import React from 'react';
import { Eye, Tags, Palette, LayoutGrid, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { DataSource } from '@/types/config';
import { DataSourceMeta } from '@/types/layer';
import { Category, Colormap } from '@/types/category';
import ColorRampPreview from '@/components/ui/ColorRampPreview';
import CategoryEditorDialog from '@/components/form/CategoryEditorDialog';
import ColormapEditorDialog from '@/components/form/ColormapEditorDialog';
import LayerRgbCompositesDisplay from './LayerRgbCompositesDisplay';
import { ExternalLink, Image } from 'lucide-react';

interface LayerDataVisualisationSectionProps {
  source: DataSource;
  onUpdateMeta: (updates: Partial<DataSourceMeta>) => void;
}

const LayerDataVisualisationSection = ({ source, onUpdateMeta }: LayerDataVisualisationSectionProps) => {
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
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categories {hasCategories && `(${categories.length})`}
            </span>
            {hasCategories && (
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
            )}
          </div>
          {hasCategories ? (
            <div className="flex flex-wrap gap-1 ml-5">
              {categories.map((cat, catIndex) => (
                <Badge key={catIndex} variant="outline" className="text-xs border-primary/30">
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
          ) : (
            <span className="text-xs text-muted-foreground italic ml-5">(none defined)</span>
          )}
        </div>

        {/* Colormaps sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Colormaps {hasColormaps && `(${colormaps.length})`}
            </span>
            {hasColormaps && (
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
            )}
          </div>
          {hasColormaps ? (
            <div className="flex flex-wrap gap-2 ml-5">
              {colormaps.map((colormap, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                  <ColorRampPreview
                    colormap={colormap.name}
                    reverse={colormap.reverse}
                    width={60}
                    height={16}
                  />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium">{colormap.name}</span>
                    <span className="text-muted-foreground">
                      {colormap.min}-{colormap.max} ({colormap.steps} steps)
                      {colormap.reverse && ' • reversed'}
                    </span>
                  </div>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic ml-5">(none defined)</span>
          )}
        </div>

        {/* Legend sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Legend {hasLegend && `- ${legend.type}`}
            </span>
          </div>
          {hasLegend ? (
            <div className="ml-5">
              {legend.type === 'image' && legend.url && (
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <a
                    href={legend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 text-sm"
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
          ) : (
            <span className="text-xs text-muted-foreground italic ml-5">(none defined)</span>
          )}
        </div>

        {/* RGB Composites sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              RGB Composites {hasRgbComposites && `(${rgbComposites.length})`}
            </span>
          </div>
          <div className="ml-5">
            <LayerRgbCompositesDisplay rgbComposites={rgbComposites} />
          </div>
        </div>

        {/* Add buttons for empty sub-sections */}
        {(!hasCategories || !hasColormaps || !hasLegend || !hasRgbComposites) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {!hasCategories && (
              <CategoryEditorDialog
                categories={[]}
                onUpdate={(cats) => onUpdateMeta({ categories: cats })}
                layerName={source.name}
                trigger={
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    + Add Categories
                  </Button>
                }
              />
            )}
            {!hasColormaps && (
              <ColormapEditorDialog
                colormaps={[]}
                onUpdate={(cmaps) => onUpdateMeta({ colormaps: cmaps })}
                metaMin={source.meta?.min}
                metaMax={source.meta?.max}
                trigger={
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    + Add Colormap
                  </Button>
                }
              />
            )}
            {!hasRgbComposites && (
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                + Add RGB Composite
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerDataVisualisationSection;
