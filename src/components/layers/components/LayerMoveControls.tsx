
import React, { useRef, useEffect, useCallback } from 'react';
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

const DOUBLE_CLICK_DELAY = 300;

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
  const upLastClickRef = useRef<number>(0);
  const downLastClickRef = useRef<number>(0);
  const upTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const downTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    };
  }, []);

  const handleUpClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - upLastClickRef.current;

    if (timeSinceLastClick < DOUBLE_CLICK_DELAY) {
      // Double-click detected - move to top
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      upLastClickRef.current = 0;
      if (canMoveToTop) onMoveToTop();
    } else {
      // First click - wait to see if double-click follows
      upLastClickRef.current = now;
      upTimeoutRef.current = setTimeout(() => {
        if (canMoveUp) onMoveUp();
        upLastClickRef.current = 0;
      }, DOUBLE_CLICK_DELAY);
    }
  }, [onMoveUp, onMoveToTop, canMoveUp, canMoveToTop]);

  const handleDownClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - downLastClickRef.current;

    if (timeSinceLastClick < DOUBLE_CLICK_DELAY) {
      // Double-click detected - move to bottom
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
      downLastClickRef.current = 0;
      if (canMoveToBottom) onMoveToBottom();
    } else {
      // First click - wait to see if double-click follows
      downLastClickRef.current = now;
      downTimeoutRef.current = setTimeout(() => {
        if (canMoveDown) onMoveDown();
        downLastClickRef.current = 0;
      }, DOUBLE_CLICK_DELAY);
    }
  }, [onMoveDown, onMoveToBottom, canMoveDown, canMoveToBottom]);

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
