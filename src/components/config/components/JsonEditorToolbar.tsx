import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw, Wand2, Search } from 'lucide-react';

interface JsonEditorToolbarProps {
  hasUnsavedChanges: boolean;
  onApplyChanges: () => void;
  onReset: () => void;
  onFormatJson: () => void;
  onToggleFindReplace?: () => void;
}

const JsonEditorToolbar = ({ 
  hasUnsavedChanges, 
  onApplyChanges, 
  onReset, 
  onFormatJson,
  onToggleFindReplace,
}: JsonEditorToolbarProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {onToggleFindReplace && (
        <Button 
          onClick={onToggleFindReplace}
          variant="outline"
          size="sm"
        >
          <Search className="h-4 w-4 mr-2" />
          Find and Replace
        </Button>
      )}
      
      <Button 
        onClick={onReset}
        disabled={!hasUnsavedChanges}
        variant="outline"
        size="sm"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </Button>
      
      <Button 
        onClick={onFormatJson}
        variant="outline"
        size="sm"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Format JSON
      </Button>

      <div className="flex-1" />
      
      <Button 
        onClick={onApplyChanges}
        disabled={!hasUnsavedChanges}
        size="sm"
        className="bg-primary hover:bg-primary/90"
      >
        <Check className="h-4 w-4 mr-2" />
        Apply Changes
      </Button>
    </div>
  );
};

export default JsonEditorToolbar;
