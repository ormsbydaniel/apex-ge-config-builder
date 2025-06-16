import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MigrationOption } from '@/hooks/useInterfaceGroupManagement';
interface DeleteInterfaceGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  layerCount: number;
  migrationOptions: MigrationOption[];
  onDelete: () => void;
  onMigrateAndDelete: (destinationGroup: string) => void;
}
const DeleteInterfaceGroupDialog = ({
  open,
  onOpenChange,
  groupName,
  layerCount,
  migrationOptions,
  onDelete,
  onMigrateAndDelete
}: DeleteInterfaceGroupDialogProps) => {
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('');

  // If no layers, show simple confirmation
  if (layerCount === 0) {
    return <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interface Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{groupName}" interface group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>;
  }

  // Migration dialog
  if (showMigrationDialog) {
    return <Dialog open={open} onOpenChange={open => {
      if (!open) {
        setShowMigrationDialog(false);
        setSelectedDestination('');
        onOpenChange(false);
      }
    }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Layers to Another Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a destination group for the {layerCount} layer{layerCount !== 1 ? 's' : ''} in "{groupName}":
            </p>
            <div>
              <Label htmlFor="destination" className="py-0">Destination Group</Label>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger className="my-[11px]">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {migrationOptions.map(option => <SelectItem key={option.groupName} value={option.groupName}>
                      {option.groupName}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setShowMigrationDialog(false);
            setSelectedDestination('');
          }}>
              Back
            </Button>
            <Button onClick={() => {
            if (selectedDestination) {
              onMigrateAndDelete(selectedDestination);
              setShowMigrationDialog(false);
              setSelectedDestination('');
              onOpenChange(false);
            }
          }} disabled={!selectedDestination}>
              Move and Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>;
  }

  // Main warning dialog with options
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Interface Group with Layers</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              The "{groupName}" interface group contains {layerCount} layer{layerCount !== 1 ? 's' : ''}. 
              What would you like to do?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {migrationOptions.length > 0 && <Button variant="outline" onClick={() => setShowMigrationDialog(true)}>
              Move Layers to Another Group
            </Button>}
          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
            Delete All Layers and Group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
};
export default DeleteInterfaceGroupDialog;