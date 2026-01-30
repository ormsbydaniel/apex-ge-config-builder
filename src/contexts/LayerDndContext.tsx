import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  CollisionDetection,
  DroppableContainer,
} from '@dnd-kit/core';
import { DataSource } from '@/types/config';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';

export type DragItemType = 'layer' | 'sub-group' | 'interface-group' | 'drop-zone';

export interface DragData {
  type: DragItemType;
  sourceIndex?: number;
  interfaceGroup?: string;
  subinterfaceGroup?: string;
  source?: DataSource;
  groupName?: string;
}

interface LayerDndContextValue {
  activeId: UniqueIdentifier | null;
  activeData: DragData | null;
  overId: UniqueIdentifier | null;
  overData: DragData | null;
}

const LayerDndContext = createContext<LayerDndContextValue>({
  activeId: null,
  activeData: null,
  overId: null,
  overData: null,
});

export const useLayerDndContext = () => useContext(LayerDndContext);

interface LayerDndProviderProps {
  children: React.ReactNode;
  sources: DataSource[];
  interfaceGroups: string[];
  onMoveLayerToGroup: (
    layerIndex: number,
    newInterfaceGroup: string,
    newSubinterfaceGroup?: string
  ) => void;
  onReorderLayer: (fromIndex: number, toIndex: number) => void;
  onReorderInterfaceGroup?: (fromIndex: number, toIndex: number) => void;
  onMoveSubGroup?: (
    parentGroup: string,
    subGroupName: string,
    targetParentGroup: string
  ) => void;
}

// Drag overlay preview component
const DragPreview = ({ data }: { data: DragData }) => {
  if (data.type === 'layer' && data.source) {
    return (
      <Card className="border-primary shadow-lg opacity-90 w-80">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm truncate">{data.source.name}</CardTitle>
            {data.source.isBaseLayer && (
              <Badge variant="secondary" className="text-xs">Base</Badge>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (data.type === 'sub-group') {
    return (
      <Card className="border-amber-500 shadow-lg opacity-90 w-64">
        <CardHeader className="py-2 px-3 bg-amber-50">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm text-amber-700">{data.subinterfaceGroup}</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (data.type === 'interface-group') {
    return (
      <Card className="border-primary shadow-lg opacity-90 w-64">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-primary">{data.groupName}</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return null;
};

// Custom collision detection that prioritizes drop-zones over layers
// This ensures dragging to a different group works correctly
const customCollisionDetection: CollisionDetection = (args) => {
  // First, check for pointer-within collisions (more accurate for nested droppables)
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // Prioritize drop-zones over layers when both are detected
    const dropZone = pointerCollisions.find(
      (collision) => (collision.data?.droppableContainer?.data?.current as DragData)?.type === 'drop-zone'
    );
    
    if (dropZone) {
      // Check if we're actually over a different group than the dragged item
      const activeData = args.active.data.current as DragData;
      const dropData = dropZone.data?.droppableContainer?.data?.current as DragData;
      
      const isDifferentGroup = 
        activeData?.interfaceGroup !== dropData?.interfaceGroup ||
        activeData?.subinterfaceGroup !== dropData?.subinterfaceGroup;
      
      if (isDifferentGroup) {
        return [dropZone];
      }
    }
    
    // Otherwise return all pointer collisions (for reordering within same group)
    return pointerCollisions;
  }
  
  // Fallback to rect intersection
  return rectIntersection(args);
};

export const LayerDndProvider = ({
  children,
  sources,
  interfaceGroups,
  onMoveLayerToGroup,
  onReorderLayer,
  onReorderInterfaceGroup,
  onMoveSubGroup,
}: LayerDndProviderProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeData, setActiveData] = useState<DragData | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [overData, setOverData] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveData(active.data.current as DragData);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverId(over.id);
      setOverData(over.data.current as DragData);
    } else {
      setOverId(null);
      setOverData(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveData(null);
      setOverId(null);
      setOverData(null);

      if (!over || active.id === over.id) return;

      const activeData = active.data.current as DragData;
      const overData = over.data.current as DragData;

      if (!activeData || !overData) return;

      // Handle layer drag
      if (activeData.type === 'layer') {
        if (overData.type === 'layer') {
          // Reorder within same or different context
          if (activeData.sourceIndex !== undefined && overData.sourceIndex !== undefined) {
            onReorderLayer(activeData.sourceIndex, overData.sourceIndex);
          }
        } else if (overData.type === 'drop-zone') {
          // Move layer to a different group/sub-group
          if (activeData.sourceIndex !== undefined && overData.interfaceGroup) {
            onMoveLayerToGroup(
              activeData.sourceIndex,
              overData.interfaceGroup,
              overData.subinterfaceGroup
            );
          }
        } else if (overData.type === 'sub-group') {
          // Move layer into sub-group
          if (activeData.sourceIndex !== undefined && overData.interfaceGroup && overData.subinterfaceGroup) {
            onMoveLayerToGroup(
              activeData.sourceIndex,
              overData.interfaceGroup,
              overData.subinterfaceGroup
            );
          }
        } else if (overData.type === 'interface-group') {
          // Move layer to interface group (remove sub-group)
          if (activeData.sourceIndex !== undefined && overData.groupName) {
            onMoveLayerToGroup(activeData.sourceIndex, overData.groupName, undefined);
          }
        }
      }

      // Handle interface group reordering
      if (activeData.type === 'interface-group' && overData.type === 'interface-group') {
        const fromIndex = interfaceGroups.indexOf(activeData.groupName || '');
        const toIndex = interfaceGroups.indexOf(overData.groupName || '');
        if (fromIndex !== -1 && toIndex !== -1 && onReorderInterfaceGroup) {
          onReorderInterfaceGroup(fromIndex, toIndex);
        }
      }
    },
    [onMoveLayerToGroup, onReorderLayer, onReorderInterfaceGroup, interfaceGroups]
  );

  const contextValue = useMemo(
    () => ({
      activeId,
      activeData,
      overId,
      overData,
    }),
    [activeId, activeData, overId, overData]
  );

  return (
    <LayerDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeData ? <DragPreview data={activeData} /> : null}
        </DragOverlay>
      </DndContext>
    </LayerDndContext.Provider>
  );
};

export default LayerDndProvider;
