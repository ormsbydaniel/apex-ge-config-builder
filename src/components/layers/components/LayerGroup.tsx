
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { DataSource } from '@/types/config';
import { useLayersTabContext } from '@/contexts/LayersTabContext';
import LayerCard from '../LayerCard';

interface LayerGroupProps {
  groupName: string;
  sources: DataSource[];
  sourceIndices: number[];
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  onRemoveInterfaceGroup: (groupName: string) => void;
}

const LayerGroup = ({ 
  groupName, 
  sources, 
  sourceIndices, 
  expandedLayers, 
  onToggleLayer,
  onRemoveInterfaceGroup 
}: LayerGroupProps) => {
  const {
    onRemoveLayer,
    onEditLayer,
    onEditBaseLayer,
    onDuplicateLayer,
    onUpdateLayer,
    onAddDataSource,
    onRemoveDataSource,
    onRemoveStatisticsSource,
    onEditDataSource,
    onEditStatisticsSource
  } = useLayersTabContext();

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-primary">{groupName}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {sources.length} layer{sources.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveInterfaceGroup(groupName)}
              className="text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {sources.map((source, idx) => {
            const actualIndex = sourceIndices[idx];
            return (
              <LayerCard
                key={actualIndex}
                source={source}
                index={actualIndex}
                onRemove={onRemoveLayer}
                onEdit={onEditLayer}
                onEditBaseLayer={onEditBaseLayer}
                onDuplicate={onDuplicateLayer}
                onUpdateLayer={onUpdateLayer}
                onAddDataSource={() => onAddDataSource(actualIndex)}
                onRemoveDataSource={(dataSourceIndex) => onRemoveDataSource(actualIndex, dataSourceIndex)}
                onRemoveStatisticsSource={(statsIndex) => onRemoveStatisticsSource(actualIndex, statsIndex)}
                onEditDataSource={(dataIndex) => onEditDataSource(actualIndex, dataIndex)}
                onEditStatisticsSource={(statsIndex) => onEditStatisticsSource(actualIndex, statsIndex)}
                isExpanded={expandedLayers.has(actualIndex)}
                onToggle={() => onToggleLayer(actualIndex)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LayerGroup;
