import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Edit, Copy, FileJson } from 'lucide-react';

interface CardActionButtonsProps {
  onEdit: () => void;
  onEditJson: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  editLabel?: string;
  jsonLabel?: string;
  duplicateLabel?: string;
  removeLabel?: string;
}

/**
 * Shared row of edit / json / duplicate / delete action buttons,
 * styled to match layer cards. Used by both layer and workflow cards
 * so the visual treatment stays in one place.
 */
const CardActionButtons = ({
  onEdit,
  onEditJson,
  onDuplicate,
  onRemove,
  editLabel = 'Edit',
  jsonLabel = 'Edit JSON',
  duplicateLabel = 'Duplicate',
  removeLabel = 'Delete',
}: CardActionButtonsProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="border-primary/30 text-primary hover:bg-primary/10 h-6 w-6 p-0"
              aria-label={editLabel}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{editLabel}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onEditJson}
              className="border-orange-500/30 text-orange-600 hover:bg-orange-50 h-6 w-6 p-0"
              aria-label={jsonLabel}
            >
              <FileJson className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{jsonLabel}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="border-blue-500/30 text-blue-600 hover:bg-blue-50 h-6 w-6 p-0"
              aria-label={duplicateLabel}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{duplicateLabel}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:bg-destructive/10 border-destructive/30 h-6 w-6 p-0"
              aria-label={removeLabel}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{removeLabel}</p></TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default CardActionButtons;
