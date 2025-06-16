
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Undo } from 'lucide-react';

interface JsonEditorToolbarProps {
  hasUnsavedChanges: boolean;
  onApplyChanges: () => void;
  onReset: () => void;
  onFormatJson: () => void;
}

const JsonEditorToolbar = ({ 
  hasUnsavedChanges, 
  onApplyChanges, 
  onReset, 
  onFormatJson 
}: JsonEditorToolbarProps) => {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        onClick={onApplyChanges}
        disabled={!hasUnsavedChanges}
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="h-4 w-4 mr-2" />
        Apply Changes
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        disabled={!hasUnsavedChanges}
      >
        <Undo className="h-4 w-4 mr-2" />
        Reset
      </Button>
      <Button
        onClick={onFormatJson}
        variant="outline"
      >
        Format JSON
      </Button>
    </div>
  );
};

export default JsonEditorToolbar;
