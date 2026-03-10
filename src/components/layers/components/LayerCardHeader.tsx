
import React, { useState, useRef, useEffect } from 'react';
import { CardHeader } from '@/components/ui/card';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  onRename?: (newName: string) => void;
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
  onRename
}: LayerCardHeaderProps) => {
  const contentLocation = source.layout?.contentLocation || 'layerCard';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(source.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(source.name);
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== source.name) {
      onRename?.(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(false);
    setEditName(source.name);
  };

  return <CardHeader className="py-3 relative">
      {!isEditing && (
        <div className="absolute top-[21px] right-2 z-10 flex items-center gap-2">
          <LayerBadge source={source} />
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
      )}
      
      <div className={`flex ${isEditing ? '' : 'pr-40'}`}>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 p-2 -ml-2 mx-[6px] px-[6px]">
            <div className="h-4 w-4 flex-shrink-0" />
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleConfirmEdit();
                else if (e.key === 'Escape') handleCancelEdit();
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-bold h-6 flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirmEdit(); }}
              className="h-5 w-5 p-0 bg-green-600 hover:bg-green-700 flex-shrink-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelEdit(); }}
              className="h-5 w-5 p-0 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <CollapsibleTrigger className="group flex gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 flex-1 py-2 mx-[6px] px-[6px]">
            <div className="flex-shrink-0 mt-[2px]">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" style={{
              minWidth: '16px',
              minHeight: '16px'
            }} /> : <ChevronRight className="h-4 w-4 text-muted-foreground" style={{
              minWidth: '16px',
              minHeight: '16px'
            }} />}
            </div>
            <div className="text-left flex items-center gap-1.5 flex-1 min-w-0">
              <h3 className="text-sm font-bold">{source.name}</h3>
              <button
                onClick={handleStartEditing}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-muted/80 transition-opacity text-muted-foreground hover:text-foreground"
                title="Rename layer"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          </CollapsibleTrigger>
        )}
      </div>
    </CardHeader>;
};
export default LayerCardHeader;
