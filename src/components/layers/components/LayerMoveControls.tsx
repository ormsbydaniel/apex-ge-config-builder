
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

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

const DOUBLE_CLICK_DELAY = 400;

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
  const upClickCountRef = useRef(0);
  const downClickCountRef = useRef(0);
  const upTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const downTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    };
  }, []);

  const handleUpClick = () => {
    upClickCountRef.current += 1;
    
    if (upClickCountRef.current === 1) {
      // First click - wait to see if double-click follows
      upTimeoutRef.current = setTimeout(() => {
        if (upClickCountRef.current === 1) {
          // Single click confirmed
          onMoveUp();
        }
        upClickCountRef.current = 0;
      }, DOUBLE_CLICK_DELAY);
    } else if (upClickCountRef.current === 2) {
      // Double-click detected
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      upClickCountRef.current = 0;
      onMoveToTop();
    }
  };

  const handleDownClick = () => {
    downClickCountRef.current += 1;
    
    if (downClickCountRef.current === 1) {
      // First click - wait to see if double-click follows
      downTimeoutRef.current = setTimeout(() => {
        if (downClickCountRef.current === 1) {
          // Single click confirmed
          onMoveDown();
        }
        downClickCountRef.current = 0;
      }, DOUBLE_CLICK_DELAY);
    } else if (downClickCountRef.current === 2) {
      // Double-click detected
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
      downClickCountRef.current = 0;
      onMoveToBottom();
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleUpClick}
        disabled={!canMoveUp && !canMoveToTop}
        className="h-5 w-5 p-0 bg-white border border-muted hover:bg-muted"
        title="Move up (double-click for top)"
        aria-label="Move up, double-click to move to top"
      >
        <ArrowUp className="h-2.5 w-2.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDownClick}
        disabled={!canMoveDown && !canMoveToBottom}
        className="h-5 w-5 p-0 bg-white border border-muted hover:bg-muted"
        title="Move down (double-click for bottom)"
        aria-label="Move down, double-click to move to bottom"
      >
        <ArrowDown className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
};

export default LayerMoveControls;
