
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddInterfaceGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (groupName: string) => boolean;
  existingGroups: string[];
}

const AddInterfaceGroupDialog = ({
  open,
  onOpenChange,
  onAdd,
  existingGroups
}: AddInterfaceGroupDialogProps) => {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    
    if (existingGroups.includes(groupName.trim())) {
      setError('Group name already exists');
      return;
    }

    const success = onAdd(groupName.trim());
    if (success) {
      setGroupName('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setGroupName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Interface Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
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
          <Button onClick={handleAdd}>
            Add Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddInterfaceGroupDialog;
