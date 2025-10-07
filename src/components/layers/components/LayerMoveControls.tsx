
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';

interface LayerMoveControlsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveToTop: boolean;
  canMoveToBottom: boolean;
}

const LayerMoveControls = ({ 
  onMoveUp, 
  onMoveDown, 
  onMoveToTop, 
  onMoveToBottom, 
  canMoveUp, 
  canMoveDown,
  canMoveToTop,
  canMoveToBottom
}: LayerMoveControlsProps) => {
  return (
    <div className="flex gap-1">
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
          title="Move up"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
          title="Move down"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onMoveToTop}
          disabled={!canMoveToTop}
          className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
          title="Move to top"
        >
          <ArrowUpToLine className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onMoveToBottom}
          disabled={!canMoveToBottom}
          className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
          title="Move to bottom"
        >
          <ArrowDownToLine className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default LayerMoveControls;
