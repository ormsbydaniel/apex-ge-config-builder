import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JsonSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  matchCount?: number;
}

const JsonSearchBar = ({ value, onChange, onClear, matchCount }: JsonSearchBarProps) => {
  return (
    <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md border border-border/50">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search in JSON..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {matchCount !== undefined && matchCount > 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {matchCount} {matchCount === 1 ? 'match' : 'matches'}
        </span>
      )}
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default JsonSearchBar;
