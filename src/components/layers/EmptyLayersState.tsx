
import React from 'react';
import { Layers } from 'lucide-react';

const EmptyLayersState = () => {
  return (
    <div className="text-center py-12 text-slate-500">
      <Layers className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium mb-2">No layers configured yet</h3>
      <p className="mb-4">Add your first layer to get started</p>
    </div>
  );
};

export default EmptyLayersState;
