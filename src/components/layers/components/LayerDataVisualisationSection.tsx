import React, { useState } from 'react';
import { Eye, Tags, Palette, Layers, Blend } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { DataSource } from '@/types/config';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { DataSourceMeta } from '@/types/layer';
import { DataSourceItem } from '@/types/dataSource';
import { Category, Colormap } from '@/types/category';
import ColorRampPreview from '@/components/ui/ColorRampPreview';
import CategoryEditorDialog from '@/components/form/CategoryEditorDialog';
import ColormapEditorDialog from '@/components/form/ColormapEditorDialog';
import GradientEditorDialog from '@/components/form/GradientEditorDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LayerDataVisualisationSectionProps {
  source: DataSource;
  onUpdateMeta: (updates: Partial<DataSourceMeta>) => void;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

const LayerDataVisualisationSection = ({ source, onUpdateMeta, onUpdateDataSources }: LayerDataVisualisationSectionProps) => {
  const [rgbDialogOpen, setRgbDialogOpen] = useState(false);
  
  const [gradientDialogOpen, setGradientDialogOpen] = useState(false);
  const categories = source.meta?.categories || [];
  const colormaps = source.meta?.colormaps || [];
  
  // Detect RGB composites from data source items
  const convertToRgbSources = (source.data || []).filter((d: DataSourceItem) => d.convertToRGB === true);
  const convertToRgbCount = convertToRgbSources.length;

  const hasCategories = categories.length > 0;
  const hasColormaps = colormaps.length > 0;
  
  const hasRgbComposites = convertToRgbCount > 0;
  const hasValues = categories.some(cat => cat.value !== undefined);
  const hasGradient = !!(source.meta?.startColor || source.meta?.endColor || source.meta?.min !== undefined || source.meta?.max !== undefined);

  // Mutual exclusivity logic
  const activeVisType: 'categories' | 'colormaps' | 'composites' | 'gradient' | null =
    hasCategories ? 'categories' :
    hasColormaps ? 'colormaps' :
    hasRgbComposites ? 'composites' :
    hasGradient ? 'gradient' :
    null;

  const visTypeLabels: Record<string, string> = {
    categories: 'categories',
    colormaps: 'colormaps',
    composites: 'RGB composites',
    gradient: 'gradient',
  };

  const isVisDisabled = (type: string) => activeVisType !== null && activeVisType !== type;
  const getDisabledTooltip = (type: string) =>
    `${type.charAt(0).toUpperCase() + type.slice(1)} editing disabled as ${visTypeLabels[activeVisType!]} defined`;

  const renderPencilButton = (type: string, onClick: () => void, dialogTrigger?: React.ReactNode) => {
    const disabled = isVisDisabled(type);
    if (dialogTrigger && !disabled) {
      return dialogTrigger;
    }
    const btn = (
      <Button
        variant="ghost"
        size="icon"
        className={`h-4 w-4 p-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
      >
        <Pencil className="h-2.5 w-2.5" />
      </Button>
    );
    if (disabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{btn}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getDisabledTooltip(type)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return btn;
  };

  const handleDeleteRgbComposites = () => {
    const updatedData = (source.data || []).map((d: DataSourceItem) => {
      if (d.convertToRGB) {
        const { convertToRGB, ...rest } = d;
        return rest as DataSourceItem;
      }
      return d;
    });
    onUpdateDataSources(updatedData);
  };

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
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[175px]">
              Categories {hasCategories ? `(${categories.length})` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            {isVisDisabled('categories') ? (
              renderPencilButton('categories', () => {})
            ) : (
              <CategoryEditorDialog
                categories={categories}
                onUpdate={(cats) => onUpdateMeta({ categories: cats })}
                layerName={source.name}
                trigger={
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                }
              />
            )}
            {hasCategories && (
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-destructive hover:text-destructive/80" onClick={() => onUpdateMeta({ categories: [] })}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
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
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[175px]">
              Colormaps {hasColormaps ? `(${colormaps.length})` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            {isVisDisabled('colormaps') ? (
              renderPencilButton('colormaps', () => {})
            ) : (
              <ColormapEditorDialog
                colormaps={colormaps}
                onUpdate={(cmaps) => onUpdateMeta({ colormaps: cmaps })}
                metaMin={source.meta?.min}
                metaMax={source.meta?.max}
                trigger={
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                }
              />
            )}
            {hasColormaps && (
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-destructive hover:text-destructive/80" onClick={() => onUpdateMeta({ colormaps: [] })}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
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
                  <span className="text-[11px] font-normal text-muted-foreground whitespace-nowrap">
                    {colormap.name} {colormap.min}-{colormap.max} ({colormap.steps} steps){colormap.reverse && ' • reversed'}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* RGB Composites sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[175px]">
              RGB Composites {hasRgbComposites ? `(${convertToRgbCount})` : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            {renderPencilButton('composites', () => setRgbDialogOpen(true))}
            {hasRgbComposites && (
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-destructive hover:text-destructive/80" onClick={handleDeleteRgbComposites}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
          {hasRgbComposites && (
            <div className="ml-5">
              <span className="text-xs text-muted-foreground italic">
                Enabled on {convertToRgbCount} data source{convertToRgbCount !== 1 ? 's' : ''}
              </span>
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

        {/* Gradient sub-section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Blend className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[175px]">
              Gradient {hasGradient ? '' : <span className="normal-case tracking-normal font-normal italic">(None)</span>}
            </span>
            {renderPencilButton('gradient', () => setGradientDialogOpen(true))}
            {hasGradient && (
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-destructive hover:text-destructive/80" onClick={() => onUpdateMeta({ startColor: undefined, endColor: undefined, min: undefined, max: undefined })}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
          {hasGradient && source.meta && (
            <div className="ml-5 space-y-1">
              {source.meta.startColor && source.meta.endColor && !hasColormaps && (
                <div
                  className="h-4 rounded border border-border"
                  style={{
                    background: `linear-gradient(to right, ${source.meta.startColor}, ${source.meta.endColor})`
                  }}
                />
              )}
              {hasColormaps && (
                <p className="text-xs text-muted-foreground italic">Colors derived from colormaps</p>
              )}
              {(source.meta.min !== undefined || source.meta.max !== undefined) && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{source.meta.min ?? '–'}</span>
                  <span>{source.meta.max ?? '–'}</span>
                </div>
              )}
            </div>
          )}

          <GradientEditorDialog
            open={gradientDialogOpen}
            onOpenChange={setGradientDialogOpen}
            meta={source.meta}
            onUpdateMeta={onUpdateMeta}
          />
        </div>

      </div>
    </div>
  );
};

export default LayerDataVisualisationSection;
