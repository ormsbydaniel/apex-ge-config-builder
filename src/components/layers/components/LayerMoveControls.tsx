
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface LayerMoveControlsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const LayerMoveControls = ({ onMoveUp, onMoveDown, canMoveUp, canMoveDown }: LayerMoveControlsProps) => {
  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
      >
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
      >
        <ArrowDown className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default LayerMoveControls;
