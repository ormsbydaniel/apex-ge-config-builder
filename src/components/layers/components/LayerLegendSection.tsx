import React, { useState } from 'react';
import { LayoutGrid, Pencil, ExternalLink, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceLayout } from '@/types/layer';
import LegendEditorDialog from '@/components/form/LegendEditorDialog';
import { safeHref } from '@/utils/urlSanitizer';

interface LayerLegendSectionProps {
  source: DataSource;
  onUpdateLayout: (updates: Partial<DataSourceLayout>) => void;
  onUpdateMeta: (updates: Record<string, any>) => void;
  onUpdateLayoutAndMeta: (layoutUpdates: Partial<DataSourceLayout>, metaUpdates: Record<string, any>) => void;
}

const LayerLegendSection = ({ source, onUpdateLayout, onUpdateMeta, onUpdateLayoutAndMeta }: LayerLegendSectionProps) => {
  const [legendDialogOpen, setLegendDialogOpen] = useState(false);
  const legend = source.layout?.layerCard?.legend || source.layout?.infoPanel?.legend;
  const hasLegend = !!legend;

  // Derive status text
  const categories = source.meta?.categories || [];
  const colormaps = source.meta?.colormaps || [];
  const hasGradient = !!(source.meta?.startColor || source.meta?.endColor || source.meta?.min !== undefined || source.meta?.max !== undefined);

  const getLegendStatusText = () => {
    if (!hasLegend) return null;
    if (legend.type === 'image') return null;
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
        <h4 className="text-sm font-medium text-foreground">Units and Legend</h4>
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setLegendDialogOpen(true)}>
          <Pencil className="h-2.5 w-2.5" />
        </Button>
      </div>

      <div className="ml-6 space-y-1">
        {source.meta?.units && (
          <span className="text-xs text-muted-foreground block">
            Units: {source.meta.units}
          </span>
        )}
        {statusText && (
          <span className="text-xs text-muted-foreground">
            Legend: {statusText}
          </span>
        )}
        {!statusText && !(hasLegend && legend.type === 'image') && (
          <span className="text-xs text-muted-foreground">
            Legend: No legend displayed.
          </span>
        )}

        {hasLegend && legend.type === 'image' && legend.url && (
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <a
              href={legend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-muted-foreground/80 underline inline-flex items-center gap-1 text-sm"
            >
              Legend Image
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <LegendEditorDialog
        open={legendDialogOpen}
        onOpenChange={setLegendDialogOpen}
        legend={legend?.type ? legend as { type: 'swatch' | 'gradient' | 'image'; url?: string } : undefined}
        units={source.meta?.units}
        onSave={(updatedLegend, updatedUnits) => {
          const metaUpdates: Record<string, any> = { units: updatedUnits || undefined };
          const isInfoPanel = source.layout?.contentLocation === 'infoPanel';
          let layoutUpdates: Partial<DataSourceLayout>;

          if (updatedLegend === null) {
            if (isInfoPanel) {
              const { legend: _removed, ...restInfoPanel } = source.layout?.infoPanel || {};
              layoutUpdates = { infoPanel: restInfoPanel };
            } else {
              const { legend: _removed, ...restLayerCard } = source.layout?.layerCard || {};
              layoutUpdates = { layerCard: restLayerCard };
            }
          } else {
            if (isInfoPanel) {
              layoutUpdates = {
                infoPanel: {
                  ...source.layout?.infoPanel,
                  legend: updatedLegend,
                },
              };
            } else {
              layoutUpdates = {
                layerCard: {
                  ...source.layout?.layerCard,
                  legend: updatedLegend,
                },
              };
            }
          }

          onUpdateLayoutAndMeta(layoutUpdates, metaUpdates);
        }}
      />
    </div>
  );
};

export default LayerLegendSection;
