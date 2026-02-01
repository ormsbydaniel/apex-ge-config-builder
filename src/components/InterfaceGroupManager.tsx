
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Check, X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useInterfaceGroups } from '@/hooks/useInterfaceGroups';
import { DataSource } from '@/types/config';

interface InterfaceGroupManagerProps {
  interfaceGroups: string[];
  sources: DataSource[];
  onUpdate: (updates: {
    interfaceGroups?: string[];
    sources?: DataSource[];
  }) => void;
}

const DOUBLE_CLICK_DELAY = 400;

const InterfaceGroupManager = ({
  interfaceGroups,
  sources,
  onUpdate
}: InterfaceGroupManagerProps) => {
  const [newInterfaceGroup, setNewInterfaceGroup] = useState('');
  const {
    editingIndex,
    editingValue,
    setEditingValue,
    addInterfaceGroup,
    removeInterfaceGroup,
    startRename,
    cancelRename,
    confirmRename,
    moveInterfaceGroup
  } = useInterfaceGroups(interfaceGroups, sources, onUpdate);

  // Track click counts per direction (not per index - indices change after moves)
  const upClickCountRef = useRef<{ index: number; count: number } | null>(null);
  const downClickCountRef = useRef<{ index: number; count: number } | null>(null);
  const upTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const downTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    };
  }, []);

  const handleUpClick = (index: number) => {
    // If clicking a different item, reset count
    if (upClickCountRef.current?.index !== index) {
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      upClickCountRef.current = { index, count: 0 };
    }
    
    upClickCountRef.current = { index, count: (upClickCountRef.current?.count || 0) + 1 };
    
    if (upClickCountRef.current.count === 1) {
      // First click - wait to see if double-click follows
      upTimeoutRef.current = setTimeout(() => {
        if (upClickCountRef.current?.count === 1) {
          // Single click confirmed - move up one position
          moveInterfaceGroup(index, Math.max(0, index - 1));
        }
        upClickCountRef.current = null;
      }, DOUBLE_CLICK_DELAY);
    } else if (upClickCountRef.current.count === 2) {
      // Double-click detected - move to top
      if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
      upClickCountRef.current = null;
      moveInterfaceGroup(index, 0);
    }
  };

  const handleDownClick = (index: number) => {
    // If clicking a different item, reset count
    if (downClickCountRef.current?.index !== index) {
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
      downClickCountRef.current = { index, count: 0 };
    }
    
    downClickCountRef.current = { index, count: (downClickCountRef.current?.count || 0) + 1 };
    
    if (downClickCountRef.current.count === 1) {
      // First click - wait to see if double-click follows
      downTimeoutRef.current = setTimeout(() => {
        if (downClickCountRef.current?.count === 1) {
          // Single click confirmed - move down one position
          moveInterfaceGroup(index, Math.min(interfaceGroups.length - 1, index + 1));
        }
        downClickCountRef.current = null;
      }, DOUBLE_CLICK_DELAY);
    } else if (downClickCountRef.current.count === 2) {
      // Double-click detected - move to bottom
      if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
      downClickCountRef.current = null;
      moveInterfaceGroup(index, interfaceGroups.length - 1);
    }
  };

  const handleAddGroup = () => {
    if (addInterfaceGroup(newInterfaceGroup)) {
      setNewInterfaceGroup('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary font-semibold">Interface Groups</CardTitle>
        <CardDescription className="text-muted-foreground">
          Organize your layers into logical groups. The order here determines the display order in the UI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newInterfaceGroup}
              onChange={e => setNewInterfaceGroup(e.target.value)}
              placeholder="Enter group name"
              onKeyPress={e => handleKeyPress(e, handleAddGroup)}
              className="border-primary/30 focus:border-primary"
            />
            <Button onClick={handleAddGroup} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {interfaceGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No interface groups yet. Add your first group above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {interfaceGroups.map((group, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-primary/10 hover:border-primary/30 transition-colors py-[6px] bg-zinc-50 rounded-md"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                  
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyPress={e => handleKeyPress(e, confirmRename)}
                        className="flex-1 border-primary/30 focus:border-primary"
                        autoFocus
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={confirmRename}
                          className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelRename}
                          className="border-primary/30 h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Badge
                        variant="secondary"
                        className="flex-1 justify-start text-primary border-primary/20 rounded-none bg-slate-50 my-0 py-[9px] min-w-0"
                      >
                        <span className="truncate">{group}</span>
                        <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">
                          ({sources.filter(s => s.layout?.interfaceGroup === group).length} sources)
                        </span>
                      </Badge>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpClick(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0 hover:bg-primary/10 border border-primary/20"
                          title="Move up (double-click for top)"
                          aria-label="Move up, double-click to move to top"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownClick(index)}
                          disabled={index === interfaceGroups.length - 1}
                          className="h-8 w-8 p-0 hover:bg-primary/10 border border-primary/20"
                          title="Move down (double-click for bottom)"
                          aria-label="Move down, double-click to move to bottom"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startRename(index)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 border border-primary/20"
                          title="Edit name"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeInterfaceGroup(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InterfaceGroupManager;
