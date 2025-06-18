
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PositionValue, getPositionDisplayName, requiresPosition } from '@/utils/positionUtils';
import { LayerTypeOption } from '@/hooks/useLayerTypeManagement';

interface DataSourcePositionProps {
  position?: PositionValue;
  layerType: LayerTypeOption;
  onEdit: () => void;
  className?: string;
}

const DataSourcePosition = ({ position, layerType, onEdit, className }: DataSourcePositionProps) => {
  if (!requiresPosition(layerType)) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onEdit}
      className={`h-auto p-1 ${className}`}
    >
      <Badge variant={position ? "secondary" : "destructive"} className="text-xs">
        {position ? getPositionDisplayName(position) : 'No Position'}
      </Badge>
    </Button>
  );
};

export default DataSourcePosition;
