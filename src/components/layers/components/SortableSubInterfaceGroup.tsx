import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DragData } from '@/contexts/LayerDndContext';
import { cn } from '@/lib/utils';

interface SortableSubInterfaceGroupProps {
  id: string;
  subGroupName: string;
  parentInterfaceGroup: string;
  children: React.ReactNode;
}

const SortableSubInterfaceGroup = ({
  id,
  subGroupName,
  parentInterfaceGroup,
  children,
}: SortableSubInterfaceGroupProps) => {
  const dragData: DragData = {
    type: 'sub-group',
    subinterfaceGroup: subGroupName,
    interfaceGroup: parentInterfaceGroup,
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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
      <div className={cn(
        "flex items-stretch gap-2",
        isDragging && "ring-2 ring-blue-500 rounded-lg"
      )}>
        {/* Drag handle for sub-interface group */}
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing px-1.5 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded transition-colors flex-shrink-0 flex items-center"
          title="Drag to reorder sub-group"
        >
          <GripVertical className="h-4 w-4 text-blue-600/70" />
        </div>

        {/* Sub-interface group content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SortableSubInterfaceGroup;
