import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (subGroupName: string) => boolean;
  parentInterfaceGroup: string;
  existingSubGroups: string[];
}

const AddSubGroupDialog = ({
  open,
  onOpenChange,
  onAdd,
  parentInterfaceGroup,
  existingSubGroups
}: AddSubGroupDialogProps) => {
  const [subGroupName, setSubGroupName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');

    if (!subGroupName.trim()) {
      setError('Sub-group name is required');
      return;
    }

    if (existingSubGroups.includes(subGroupName.trim())) {
      setError('A sub-group with this name already exists in this interface group');
      return;
    }

    const success = onAdd(subGroupName.trim());
    if (success) {
      setSubGroupName('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSubGroupName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sub-Group to "{parentInterfaceGroup}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a sub-group to organize layers within the "{parentInterfaceGroup}" interface group.
          </p>
          <div>
            <Label htmlFor="subGroupName">Sub-Group Name</Label>
            <Input
              id="subGroupName"
              value={subGroupName}
              onChange={(e) => setSubGroupName(e.target.value)}
              placeholder="Enter sub-group name"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700">
            Add Sub-Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubGroupDialog;
