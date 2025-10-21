
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, LayoutPanelLeft, Menu } from 'lucide-react';
import { DataSource, LayerValidationResult } from '@/types/config';
import { Badge } from '@/components/ui/badge';
import LayerBadge from './LayerBadge';
import LayerActions from './LayerActions';
import LayerQAStatus from './LayerQAStatus';
import LayerValidationStatus from './LayerValidationStatus';
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
  validationResult?: LayerValidationResult;
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
  handleEdit,
  validationResult
}: LayerCardHeaderProps) => {
  const contentLocation = source.layout?.contentLocation || 'layerCard';
  
  return <CardHeader className="py-3 relative">
      {/* Descriptive badges positioned near layer name */}
      <div className="absolute top-[21px] left-[65px] z-10 flex items-center gap-2">
        <LayerBadge source={source} />
      </div>
      
      {/* Status badges and Actions positioned on far right */}
      <div className="absolute top-[21px] right-2 z-10 flex items-center gap-2">
        <LayerQAStatus source={source} />
        <LayerValidationStatus validationResult={validationResult} />
        <Badge variant="outline" className="flex items-center gap-1 text-xs border-teal-500 text-teal-600">
          {contentLocation === 'infoPanel' ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <rect x="10" y="4" width="4" height="8" rx="0.5" fill="currentColor"/>
              </svg>
              <span>info panel</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="4" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <line x1="2.5" y1="7" x2="8.5" y2="7" stroke="currentColor" strokeWidth="1"/>
                <line x1="2.5" y1="9" x2="8.5" y2="9" stroke="currentColor" strokeWidth="1"/>
              </svg>
              <span>layer card</span>
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
