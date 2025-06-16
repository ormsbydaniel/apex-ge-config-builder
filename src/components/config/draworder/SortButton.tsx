
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

type SortField = 'zIndex' | 'url' | 'layerName' | 'interfaceGroup' | 'sourceType';
type SortDirection = 'asc' | 'desc';

interface SortButtonProps {
  field: SortField;
  currentSortField: SortField;
  currentSortDirection: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

const SortButton = ({ field, currentSortField, currentSortDirection, onSort, children }: SortButtonProps) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onSort(field)}
    className="h-auto p-1 font-medium"
  >
    {children}
    <div className="ml-1 flex flex-col">
      <ChevronUp 
        className={`h-3 w-3 ${currentSortField === field && currentSortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground'}`} 
      />
      <ChevronDown 
        className={`h-3 w-3 -mt-1 ${currentSortField === field && currentSortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground'}`} 
      />
    </div>
  </Button>
);

export default SortButton;
