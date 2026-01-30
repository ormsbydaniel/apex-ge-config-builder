import React, { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useLayerDndContext, DragData } from '@/contexts/LayerDndContext';

interface DroppableGroupZoneProps {
  id: string;
  interfaceGroup: string;
  subinterfaceGroup?: string;
  children: React.ReactNode;
  className?: string;
  acceptsLayers?: boolean;
  isCollapsed?: boolean;
  onExpand?: () => void;
}

const AUTO_EXPAND_DELAY = 600; // ms to wait before auto-expanding

const DroppableGroupZone = ({
  id,
  interfaceGroup,
  subinterfaceGroup,
  children,
  className,
  acceptsLayers = true,
  isCollapsed = false,
  onExpand,
}: DroppableGroupZoneProps) => {
  const { activeData } = useLayerDndContext();
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onExpandRef = useRef<(() => void) | undefined>(onExpand);

  // Keep latest callback without restarting hover timers due to function identity changes
  useEffect(() => {
    onExpandRef.current = onExpand;
  }, [onExpand]);

  const dropData: DragData = {
    type: 'drop-zone',
    interfaceGroup,
    subinterfaceGroup,
  };

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: dropData,
    disabled: !acceptsLayers,
  });

  // Only show drop indicator when dragging a layer
  const showDropIndicator = isOver && activeData?.type === 'layer';

  // Don't show drop indicator if dragging within the same group
  const isSameGroup =
    activeData?.interfaceGroup === interfaceGroup &&
    activeData?.subinterfaceGroup === subinterfaceGroup;

  const showValidDrop = showDropIndicator && !isSameGroup;

  // Auto-expand collapsed groups when hovering during drag.
  // IMPORTANT: don't depend on `onExpand` identity, otherwise re-renders can keep clearing the timer.
  useEffect(() => {
    const shouldAutoExpand = showValidDrop && isCollapsed && !!onExpandRef.current;

    if (shouldAutoExpand && !expandTimerRef.current) {
      expandTimerRef.current = setTimeout(() => {
        onExpandRef.current?.();
        expandTimerRef.current = null;
      }, AUTO_EXPAND_DELAY);
    }

    if (!shouldAutoExpand && expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }

    return () => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    };
  }, [showValidDrop, isCollapsed]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-all duration-200 rounded-lg',
        showValidDrop && 'ring-2 ring-primary ring-dashed bg-primary/5',
        className
      )}
    >
      {children}
      
      {/* Drop indicator message */}
      {showValidDrop && (
        <div className="mt-2 p-2 text-center text-xs text-primary border-2 border-dashed border-primary/50 rounded-md bg-primary/5">
          {isCollapsed 
            ? `Hover to expand "${subinterfaceGroup || interfaceGroup}"...`
            : `Drop to move layer ${subinterfaceGroup ? `into "${subinterfaceGroup}"` : `into "${interfaceGroup}"`}`
          }
        </div>
      )}
    </div>
  );
};

export default DroppableGroupZone;
