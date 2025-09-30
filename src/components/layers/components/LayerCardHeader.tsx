
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, LayoutPanelLeft, Menu } from 'lucide-react';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';
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
  const contentLocation = source.layout?.contentLocation || 'layerCard';
  
  return <CardHeader className="py-3 relative">
      {/* Badge and Actions positioned to align with layer name */}
      <div className="absolute top-[21px] right-2 z-10 flex items-center gap-2">
        <LayerBadge source={source} />
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          {contentLocation === 'infoPanel' ? (
            <>
              <LayoutPanelLeft className="h-3 w-3" />
              <span>Info Panel</span>
            </>
          ) : (
            <>
              <Menu className="h-3 w-3" />
              <span>Layer Card</span>
            </>
          )}
        </Badge>
        <LayerActions index={index} source={source} onRemove={onRemove} onEdit={onEdit} onDuplicate={onDuplicate} onEditJson={onEditJson} handleEdit={handleEdit} />
      </div>
      
      <div className="flex pr-40">
        <CollapsibleTrigger className="flex gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 flex-1 py-2 mx-[6px] px-[6px]">
          <div className="flex-shrink-0 mt-[2px]">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" style={{
            minWidth: '16px',
            minHeight: '16px'
          }} /> : <ChevronRight className="h-4 w-4 text-muted-foreground" style={{
            minWidth: '16px',
            minHeight: '16px'
          }} />}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold">{source.name}</h3>
            {isExpanded && source.meta?.description && <p className="text-xs text-muted-foreground mt-1 mr-8">{source.meta.description}</p>}
          </div>
        </CollapsibleTrigger>
      </div>
    </CardHeader>;
};
export default LayerCardHeader;
