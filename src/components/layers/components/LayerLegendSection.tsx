import React, { useState } from 'react';
import { LayoutGrid, Pencil, ExternalLink, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceLayout } from '@/types/layer';
import LegendEditorDialog from '@/components/form/LegendEditorDialog';

interface LayerLegendSectionProps {
  source: DataSource;
  onUpdateLayout: (updates: Partial<DataSourceLayout>) => void;
}

const LayerLegendSection = ({ source, onUpdateLayout }: LayerLegendSectionProps) => {
  const [legendDialogOpen, setLegendDialogOpen] = useState(false);
  const legend = source.layout?.layerCard?.legend || source.layout?.infoPanel?.legend;
  const hasLegend = !!legend;

  // Derive status text
  const categories = source.meta?.categories || [];
  const colormaps = source.meta?.colormaps || [];
  const hasGradient = !!(source.meta?.startColor || source.meta?.endColor || source.meta?.min !== undefined || source.meta?.max !== undefined);

  const getLegendStatusText = () => {
    if (!hasLegend) return null;
    if (legend.type === 'image') return 'Image';
    // swatch or gradient type → derive from active vis
    if (categories.length > 0) return 'Auto (from categories)';
    if (colormaps.length > 0) return 'Auto (from colormaps)';
    if (hasGradient) return 'Auto (from gradient)';
    return 'Auto';
  };

  const statusText = getLegendStatusText();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Legend and Units</h4>
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setLegendDialogOpen(true)}>
          <Pencil className="h-2.5 w-2.5" />
        </Button>
      </div>

      <div className="ml-6 space-y-1">
        <span className="text-xs text-muted-foreground">
          {statusText ? statusText : <span className="italic">(None)</span>}
        </span>

        {hasLegend && legend.type === 'image' && legend.url && (
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
      </div>

      <LegendEditorDialog
        open={legendDialogOpen}
        onOpenChange={setLegendDialogOpen}
        legend={legend?.type ? legend as { type: 'swatch' | 'gradient' | 'image'; url?: string } : undefined}
        onUpdateLegend={(updatedLegend) => {
          const isInfoPanel = source.layout?.contentLocation === 'infoPanel';
          if (isInfoPanel) {
            onUpdateLayout({
              infoPanel: {
                ...source.layout?.infoPanel,
                legend: updatedLegend,
              },
            });
          } else {
            onUpdateLayout({
              layerCard: {
                ...source.layout?.layerCard,
                legend: updatedLegend,
              },
            });
          }
        }}
      />
    </div>
  );
};

export default LayerLegendSection;
