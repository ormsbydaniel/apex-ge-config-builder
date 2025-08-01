
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';

interface LayersTabHeaderProps {
  layerCount: number;
  onAddGroup: () => void;
}

const LayersTabHeader = ({ layerCount, onAddGroup }: LayersTabHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-primary flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Map Layers
          </CardTitle>
          <CardDescription>
            Configure your map layers organized by interface groups. Total: {layerCount} layers
          </CardDescription>
        </div>
        <Button 
          onClick={onAddGroup}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>
    </CardHeader>
  );
};

export default LayersTabHeader;
