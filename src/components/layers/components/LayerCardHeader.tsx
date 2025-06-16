
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, SwitchCamera } from 'lucide-react';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import LayerActions from './LayerActions';

interface LayerCardHeaderProps {
  source: DataSource;
  index: number;
  isExpanded: boolean;
  isSwipeLayer: boolean;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  handleEdit: () => void;
}

const LayerCardHeader = ({
  source,
  index,
  isExpanded,
  isSwipeLayer,
  onRemove,
  onEdit,
  onDuplicate,
  handleEdit
}: LayerCardHeaderProps) => {
  return (
    <CollapsibleTrigger asChild>
      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{source.name}</CardTitle>
                {isSwipeLayer && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <SwitchCamera className="h-3 w-3" />
                    Swipe
                  </Badge>
                )}
              </div>
              {source.meta?.description && (
                <CardDescription>{source.meta.description}</CardDescription>
              )}
              {isSwipeLayer && source.meta?.swipeConfig && (
                <CardDescription className="text-xs text-muted-foreground">
                  Clipped: {source.meta.swipeConfig.clippedSourceName} | 
                  Base: {source.meta.swipeConfig.baseSourceNames?.join(', ') || 
                       (source.meta.swipeConfig as any).baseSourceName}
                </CardDescription>
              )}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <LayerActions
              index={index}
              onRemove={onRemove}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              handleEdit={handleEdit}
            />
          </div>
        </div>
      </CardHeader>
    </CollapsibleTrigger>
  );
};

export default LayerCardHeader;
