import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { WorkflowItem } from '@/types/dataSource';
import { WorkflowCard } from './WorkflowCard';

interface SortableWorkflowCardProps {
  id: string;
  workflow: WorkflowItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onEditJson: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onUpdate: (workflow: WorkflowItem) => void;
}

const SortableWorkflowCard = ({ id, ...cardProps }: SortableWorkflowCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <WorkflowCard {...cardProps} />
        </div>
      </div>
    </div>
  );
};

export default SortableWorkflowCard;
