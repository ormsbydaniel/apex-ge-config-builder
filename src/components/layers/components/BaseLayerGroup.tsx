
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, Check, AlertTriangle, Triangle, Download } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import { calculateQAStats } from '@/utils/qaUtils';
import LayerCard from '../LayerCard';
import LayerMoveControls from './LayerMoveControls';
import { useLayerStateManagement } from '@/hooks/useLayerStateManagement';

interface BaseLayerGroupProps {
  baseLayers: Array<{ layer: DataSource; originalIndex: number }>;
  isExpanded: boolean;
  onToggle: () => void;
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
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onAddBaseLayer: () => void;
  onAddRecommendedBaseLayers: () => void;
  isLoadingRecommended?: boolean;
}

const BaseLayerGroup = ({
  baseLayers,
  isExpanded,
  onToggle,
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
  onMoveLayer,
  onAddBaseLayer,
  onAddRecommendedBaseLayers,
  isLoadingRecommended
}: BaseLayerGroupProps) => {
  const { toggleCard, isExpanded: isCardExpanded } = useLayerStateManagement();

  // Calculate QA stats for base layers
  const qaStats = calculateQAStats(baseLayers.map(item => item.layer));

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-green-700">Base Layers</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {baseLayers.length} layer{baseLayers.length !== 1 ? 's' : ''}
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddRecommendedBaseLayers}
                disabled={isLoadingRecommended}
                className="text-primary hover:bg-primary/10 border-primary/30"
              >
                <Download className="h-3 w-3 mr-1" />
                {isLoadingRecommended ? 'Loading...' : 'Add Recommended Base Layers'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddBaseLayer}
                className="text-primary hover:bg-primary/10 border-primary/30"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Base Layer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-3 bg-slate-200">
            <div className="space-y-3">
              {baseLayers.map(({ layer, originalIndex }, indexInGroup) => (
                <div key={originalIndex} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <LayerCard
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
                      isExpanded={isCardExpanded(`base-${originalIndex}`)}
                      onToggle={() => toggleCard(`base-${originalIndex}`)}
                    />
                  </div>
                  <LayerMoveControls
                    onMoveUp={() => {
                      const prevLayer = baseLayers[indexInGroup - 1];
                      if (prevLayer) {
                        onMoveLayer(originalIndex, prevLayer.originalIndex);
                      }
                    }}
                    onMoveDown={() => {
                      const nextLayer = baseLayers[indexInGroup + 1];
                      if (nextLayer) {
                        onMoveLayer(originalIndex, nextLayer.originalIndex);
                      }
                    }}
                    onMoveToTop={() => {
                      const firstLayer = baseLayers[0];
                      if (firstLayer && originalIndex !== firstLayer.originalIndex) {
                        onMoveLayer(originalIndex, firstLayer.originalIndex);
                      }
                    }}
                    onMoveToBottom={() => {
                      const lastLayer = baseLayers[baseLayers.length - 1];
                      if (lastLayer && originalIndex !== lastLayer.originalIndex) {
                        onMoveLayer(originalIndex, lastLayer.originalIndex);
                      }
                    }}
                    canMoveUp={indexInGroup > 0}
                    canMoveDown={indexInGroup < baseLayers.length - 1}
                    canMoveToTop={indexInGroup > 0}
                    canMoveToBottom={indexInGroup < baseLayers.length - 1}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default BaseLayerGroup;
