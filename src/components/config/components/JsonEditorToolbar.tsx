import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, RotateCcw, Wand2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface JsonEditorToolbarProps {
  hasUnsavedChanges: boolean;
  onApplyChanges: () => void;
  onReset: () => void;
  onFormatJson: () => void;
  onFind?: (query: string) => void;
  onReplace?: (searchValue: string, replaceValue: string, replaceAll: boolean) => void;
}

const JsonEditorToolbar = ({ 
  hasUnsavedChanges, 
  onApplyChanges, 
  onReset, 
  onFormatJson,
  onFind,
  onReplace,
}: JsonEditorToolbarProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleFind = () => {
    if (onFind) {
      onFind(searchValue);
    }
  };

  const handleReplace = () => {
    if (onReplace) {
      onReplace(searchValue, replaceValue, false);
      setSearchValue('');
      setReplaceValue('');
      setIsOpen(false);
    }
  };

  const handleReplaceAll = () => {
    if (onReplace) {
      onReplace(searchValue, replaceValue, true);
      setSearchValue('');
      setReplaceValue('');
      setIsOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Find and Replace
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Find</label>
              <Input
                placeholder="Search text..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Replace with</label>
              <Input
                placeholder="Replacement text..."
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReplace()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleFind}
                disabled={!searchValue}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Find
              </Button>
              <Button 
                onClick={handleReplace}
                disabled={!searchValue || !replaceValue}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Replace
              </Button>
              <Button 
                onClick={handleReplaceAll}
                disabled={!searchValue || !replaceValue}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Replace All
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
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
