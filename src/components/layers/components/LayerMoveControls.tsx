
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

const CLICK_DELAY = 250;

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
  const upTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const downTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const upDoubleClickedRef = useRef(false);
  const downDoubleClickedRef = useRef(false);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    };
  }, []);

  const handleUpClick = useCallback(() => {
    // Clear any existing timeout
    if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
    
    // Set a delayed single-click action
    upTimeoutRef.current = setTimeout(() => {
      // Only fire if double-click didn't happen
      if (!upDoubleClickedRef.current && canMoveUp) {
        onMoveUp();
      }
      upDoubleClickedRef.current = false;
    }, CLICK_DELAY);
  }, [onMoveUp, canMoveUp]);

  const handleUpDoubleClick = useCallback(() => {
    // Cancel the pending single-click
    if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
    upDoubleClickedRef.current = true;
    
    if (canMoveToTop) {
      onMoveToTop();
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      upDoubleClickedRef.current = false;
    }, 50);
  }, [onMoveToTop, canMoveToTop]);

  const handleDownClick = useCallback(() => {
    // Clear any existing timeout
    if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    
    // Set a delayed single-click action
    downTimeoutRef.current = setTimeout(() => {
      // Only fire if double-click didn't happen
      if (!downDoubleClickedRef.current && canMoveDown) {
        onMoveDown();
      }
      downDoubleClickedRef.current = false;
    }, CLICK_DELAY);
  }, [onMoveDown, canMoveDown]);

  const handleDownDoubleClick = useCallback(() => {
    // Cancel the pending single-click
    if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    downDoubleClickedRef.current = true;
    
    if (canMoveToBottom) {
      onMoveToBottom();
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      downDoubleClickedRef.current = false;
    }, 50);
  }, [onMoveToBottom, canMoveToBottom]);

  return (
    <div className="flex flex-col gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleUpClick}
        onDoubleClick={handleUpDoubleClick}
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
        onDoubleClick={handleDownDoubleClick}
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
