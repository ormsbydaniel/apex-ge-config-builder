
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface LayerBadgeProps {
  isBaseLayer: boolean;
}

const LayerBadge = ({ isBaseLayer }: LayerBadgeProps) => {
  return (
    <Badge variant={isBaseLayer ? "secondary" : "default"}>
      {isBaseLayer ? "Base Layer" : "Layer Card"}
    </Badge>
  );
};

export default LayerBadge;
