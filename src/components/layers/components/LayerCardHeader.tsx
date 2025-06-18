
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DataSource } from '@/types/config';
import LayerBadge from './LayerBadge';
import LayerActions from './LayerActions';

interface LayerCardHeaderProps {
  source: DataSource;
  index: number;
  isExpanded: boolean;
  isSwipeLayer: boolean;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onEditJson: (index: number) => void;
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
  onEditJson,
  handleEdit 
}: LayerCardHeaderProps) => {
  const isBaseLayer = source.isBaseLayer === true;
  
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 flex-1">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex items-center gap-2 flex-1">
            <LayerBadge isBaseLayer={isBaseLayer} />
            <div className="text-left">
              <h3 className="font-medium text-sm">{source.name}</h3>
              {source.meta?.description && (
                <p className="text-xs text-muted-foreground mt-1">{source.meta.description}</p>
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <LayerActions
          index={index}
          onRemove={onRemove}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onEditJson={onEditJson}
          handleEdit={handleEdit}
        />
      </div>
    </CardHeader>
  );
};

export default LayerCardHeader;
