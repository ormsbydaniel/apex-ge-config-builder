import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import { DragData, useLayerDndContext } from '@/contexts/LayerDndContext';
import { cn } from '@/lib/utils';

interface SortableLayerCardProps {
  id: string;
  source: DataSource;
  index: number;
  interfaceGroup?: string;
  subinterfaceGroup?: string;
  // LayerCard props
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
  onAddStatisticsSource?: () => void;
  onAddConstraintSource?: (layerIndex: number) => void;
  onRemoveConstraintSource?: (constraintIndex: number) => void;
  onEditConstraintSource?: (constraintIndex: number) => void;
  onMoveConstraintUp?: (constraintIndex: number) => void;
  onMoveConstraintDown?: (constraintIndex: number) => void;
  onMoveConstraintToTop?: (constraintIndex: number) => void;
  onMoveConstraintToBottom?: (constraintIndex: number) => void;
  onAddWorkflow?: (workflow: any) => void;
  onRemoveWorkflow?: (workflowIndex: number) => void;
  onUpdateWorkflow?: (workflowIndex: number, workflow: any) => void;
  onMoveWorkflowUp?: (workflowIndex: number) => void;
  onMoveWorkflowDown?: (workflowIndex: number) => void;
  onMoveWorkflowToTop?: (workflowIndex: number) => void;
  onMoveWorkflowToBottom?: (workflowIndex: number) => void;
  onAddChart?: () => void;
  onRemoveChart?: (chartIndex: number) => void;
  onEditChart?: (chartIndex: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const SortableLayerCard = ({
  id,
  source,
  index,
  interfaceGroup,
  subinterfaceGroup,
  ...layerCardProps
}: SortableLayerCardProps) => {
  const { activeData } = useLayerDndContext();
  
  const dragData: DragData = {
    type: 'layer',
    sourceIndex: index,
    interfaceGroup,
    subinterfaceGroup,
    source,
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

  // Check if we're receiving a cross-group drop
  const isReceivingCrossGroupDrop = 
    isOver && 
    activeData?.type === 'layer' &&
    (activeData.interfaceGroup !== interfaceGroup || 
     activeData.subinterfaceGroup !== subinterfaceGroup);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      {/* Cross-group insertion indicator - shows above this card */}
      {isReceivingCrossGroupDrop && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-full z-10 animate-pulse" />
      )}
      
      <div className={cn(
        "flex items-center gap-2 transition-all duration-150",
        isReceivingCrossGroupDrop && "translate-y-1"
      )}>
        {/* Drag handle */}
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
          title="Drag to reorder or move between groups"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Layer card */}
        <div className="flex-1">
          <LayerCard
            source={source}
            index={index}
            {...layerCardProps}
          />
        </div>
      </div>
    </div>
  );
};

export default SortableLayerCard;
