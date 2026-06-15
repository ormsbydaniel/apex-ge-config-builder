import React from 'react';
import { DataSource } from '@/types/config';
import LayerQAStatus from './LayerQAStatus';
import CardActionButtons from '@/components/shared/CardActionButtons';

interface LayerActionsProps {
  index: number;
  source: DataSource;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onEditJson: (index: number) => void;
  handleEdit: () => void;
}

const LayerActions = ({ index, source, onRemove, onDuplicate, onEditJson, handleEdit }: LayerActionsProps) => {
  return (
    <div className="flex items-center gap-1 justify-end ml-3">
      <div className="h-6 w-px bg-border mr-2"></div>
      <CardActionButtons
        onEdit={handleEdit}
        onEditJson={() => onEditJson(index)}
        onDuplicate={() => onDuplicate(index)}
        onRemove={() => onRemove(index)}
        editLabel="Edit layer"
        duplicateLabel="Duplicate layer"
        removeLabel="Delete layer"
      />
      <div className="h-6 w-px bg-border mx-2"></div>
      <LayerQAStatus source={source} />
    </div>
  );
};

export default LayerActions;
