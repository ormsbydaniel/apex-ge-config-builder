
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import GroupNameEditor from './GroupNameEditor';

interface GroupHeaderProps {
  groupName: string;
  layerCount: number;
  isExpanded: boolean;
  onEditGroup?: (groupName: string, newName: string) => boolean;
  onDeleteGroup?: (groupName: string) => void;
  onAddLayer: () => void;
}

const GroupHeader = ({
  groupName,
  layerCount,
  isExpanded,
  onEditGroup,
  onDeleteGroup,
  onAddLayer
}: GroupHeaderProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteGroup?.(groupName);
  };

  const handleAddLayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddLayer();
  };

  return (
    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-primary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-primary" />
          )}
          
          <GroupNameEditor
            groupName={groupName}
            onEdit={onEditGroup}
          />
          
          <Badge variant="secondary" className="text-xs">
            {layerCount} layers
          </Badge>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
          {onDeleteGroup && (
            <Button 
              onClick={handleDelete} 
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button 
            onClick={handleAddLayer} 
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Layer
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default GroupHeader;
