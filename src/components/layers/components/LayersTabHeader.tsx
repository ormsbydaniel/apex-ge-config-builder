
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface LayersTabHeaderProps {
  onAddGroup: () => void;
  onAddBaseLayer: () => void;
}

const LayersTabHeader = ({ onAddGroup, onAddBaseLayer }: LayersTabHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">Layers</h2>
      <div className="flex gap-2">
        <Button onClick={onAddGroup} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
        <Button onClick={onAddBaseLayer} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Base Layer
        </Button>
      </div>
    </div>
  );
};

export default LayersTabHeader;
