import React from 'react';
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
}

const DroppableGroupZone = ({
  id,
  interfaceGroup,
  subinterfaceGroup,
  children,
  className,
  acceptsLayers = true,
}: DroppableGroupZoneProps) => {
  const { activeData } = useLayerDndContext();

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
          Drop to move layer {subinterfaceGroup ? `into "${subinterfaceGroup}"` : `into "${interfaceGroup}"`}
        </div>
      )}
    </div>
  );
};

export default DroppableGroupZone;
