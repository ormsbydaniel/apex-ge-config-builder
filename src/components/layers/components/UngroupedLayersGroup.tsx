
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Check, AlertTriangle, Triangle } from 'lucide-react';
import { DataSource } from '@/types/config';
import { calculateQAStats } from '@/utils/qaUtils';
import LayerCard from '../LayerCard';
import { useLayerCardState } from '@/hooks/useLayerCardState';

interface UngroupedLayersGroupProps {
  ungroupedLayers: Array<{ layer: DataSource; originalIndex: number }>;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const UngroupedLayersGroup = ({
  ungroupedLayers,
  onRemove,
  onEdit,
  onEditBaseLayer,
  onDuplicate,
  onUpdateLayer,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  isExpanded = false,
  onToggle
}: UngroupedLayersGroupProps) => {
  const { toggleCard, isExpanded: isCardExpanded } = useLayerCardState();

  // Calculate QA stats for ungrouped layers
  const qaStats = calculateQAStats(ungroupedLayers.map(item => item.layer));

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 -mr-2">
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base text-amber-700">
                Ungrouped Layers
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {ungroupedLayers.length} layer{ungroupedLayers.length !== 1 ? 's' : ''}
              </Badge>
              
              {/* QA Status Indicators */}
              <div className="flex items-center gap-2">
                {qaStats.success > 0 && (
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">{qaStats.success}</span>
                  </div>
                )}
                {qaStats.info > 0 && (
                  <div className="flex items-center gap-1">
                    <Triangle className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">{qaStats.info}</span>
                  </div>
                )}
                {qaStats.warning > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-amber-600">{qaStats.warning}</span>
                  </div>
                )}
                {qaStats.error > 0 && (
                  <div className="flex items-center gap-1">
                    <Triangle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">{qaStats.error}</span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {ungroupedLayers.map(({ layer, originalIndex }) => (
                <LayerCard
                  key={originalIndex}
                  source={layer}
                  index={originalIndex}
                  onRemove={onRemove}
                  onEdit={onEdit}
                  onEditBaseLayer={onEditBaseLayer}
                  onDuplicate={onDuplicate}
                  onUpdateLayer={onUpdateLayer}
                  onAddDataSource={() => onAddDataSource(originalIndex)}
                  onRemoveDataSource={(dataSourceIndex) => onRemoveDataSource(originalIndex, dataSourceIndex)}
                  onRemoveStatisticsSource={(statsIndex) => onRemoveStatisticsSource(originalIndex, statsIndex)}
                  onEditDataSource={(dataIndex) => onEditDataSource(originalIndex, dataIndex)}
                  onEditStatisticsSource={(statsIndex) => onEditStatisticsSource(originalIndex, statsIndex)}
                  isExpanded={isCardExpanded(`ungrouped-${originalIndex}`)}
                  onToggle={() => toggleCard(`ungrouped-${originalIndex}`)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default UngroupedLayersGroup;
