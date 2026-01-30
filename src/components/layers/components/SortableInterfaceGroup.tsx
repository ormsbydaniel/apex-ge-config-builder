import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DragData } from '@/contexts/LayerDndContext';
import { cn } from '@/lib/utils';

interface SortableInterfaceGroupProps {
  id: string;
  groupName: string;
  groupIndex: number;
  children: React.ReactNode;
}

const SortableInterfaceGroup = ({
  id,
  groupName,
  groupIndex,
  children,
}: SortableInterfaceGroupProps) => {
  const dragData: DragData = {
    type: 'interface-group',
    groupName,
    sourceIndex: groupIndex,
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    data: dragData,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      {/* Drop indicator line above when another group is hovering */}
      {isOver && !isDragging && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-primary rounded-full z-10" />
      )}
      
      <div className={cn(
        "flex items-start gap-2",
        isDragging && "ring-2 ring-primary rounded-lg"
      )}>
        {/* Drag handle for interface group */}
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 mt-3 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
          title="Drag to reorder interface group"
        >
          <GripVertical className="h-5 w-5 text-primary/70" />
        </div>

        {/* Interface group content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SortableInterfaceGroup;
