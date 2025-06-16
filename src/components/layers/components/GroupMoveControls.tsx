
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface GroupMoveControlsProps {
  onMoveGroup?: (direction: 'up' | 'down') => void;
  canMoveGroupUp?: boolean;
  canMoveGroupDown?: boolean;
}

const GroupMoveControls = ({
  onMoveGroup,
  canMoveGroupUp = false,
  canMoveGroupDown = false
}: GroupMoveControlsProps) => {
  if (!onMoveGroup) return null;

  return (
    <div className="flex-shrink-0 pt-4">
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMoveGroup('up')}
          disabled={!canMoveGroupUp}
          className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMoveGroup('down')}
          disabled={!canMoveGroupDown}
          className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default GroupMoveControls;
