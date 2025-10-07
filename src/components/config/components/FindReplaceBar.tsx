import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface FindReplaceBarProps {
  searchValue: string;
  replaceValue: string;
  onSearchChange: (value: string) => void;
  onReplaceChange: (value: string) => void;
  onFind: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

const FindReplaceBar = ({
  searchValue,
  replaceValue,
  onSearchChange,
  onReplaceChange,
  onFind,
  onReplace,
  onReplaceAll,
  onClose,
}: FindReplaceBarProps) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-md">
      <Input
        placeholder="Find text..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onFind()}
        className="h-9 max-w-[200px]"
      />
      <Button 
        onClick={onFind}
        disabled={!searchValue}
        variant="outline"
        size="sm"
      >
        Find
      </Button>
      
      <div className="w-px h-6 bg-border" />
      
      <Input
        placeholder="Replace text..."
        value={replaceValue}
        onChange={(e) => onReplaceChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onReplace()}
        className="h-9 max-w-[200px]"
      />
      <Button 
        onClick={onReplace}
        disabled={!searchValue || !replaceValue}
        variant="outline"
        size="sm"
      >
        Replace
      </Button>
      <Button 
        onClick={onReplaceAll}
        disabled={!searchValue || !replaceValue}
        variant="outline"
        size="sm"
      >
        Replace All
      </Button>
      
      <div className="flex-1" />
      
      <Button
        onClick={onClose}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FindReplaceBar;
