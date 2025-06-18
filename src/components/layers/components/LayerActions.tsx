
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Edit, Copy, FileJson } from 'lucide-react';

interface LayerActionsProps {
  index: number;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onEditJson: (index: number) => void;
  handleEdit: () => void;
}

const LayerActions = ({ index, onRemove, onDuplicate, onEditJson, handleEdit }: LayerActionsProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="border-primary/30 text-primary hover:bg-primary/10 h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit layer</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditJson(index)}
              className="border-orange-500/30 text-orange-600 hover:bg-orange-50 h-8 w-8 p-0"
            >
              <FileJson className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit JSON</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(index)}
              className="border-blue-500/30 text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Duplicate layer</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-destructive hover:bg-destructive/10 border-destructive/30 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete layer</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default LayerActions;
