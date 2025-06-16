
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit2 } from 'lucide-react';

interface GroupNameEditorProps {
  groupName: string;
  onEdit?: (groupName: string, newName: string) => boolean;
}

const GroupNameEditor = ({ groupName, onEdit }: GroupNameEditorProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(groupName);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
  };

  const handleConfirmEdit = () => {
    if (onEdit && editingName.trim() && editingName.trim() !== groupName) {
      const success = onEdit(groupName, editingName.trim());
      if (success) {
        setIsEditingName(false);
      }
    } else {
      setIsEditingName(false);
      setEditingName(groupName);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditingName(groupName);
  };

  if (isEditingName) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirmEdit();
            if (e.key === 'Escape') handleCancelEdit();
          }}
          className="h-7 w-48"
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={handleConfirmEdit}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg text-primary font-semibold">{groupName}</span>
      {onEdit && (
        <Button size="sm" variant="ghost" onClick={handleStartEdit}>
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default GroupNameEditor;
