import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DeleteSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroupName: string;
  parentInterfaceGroup: string;
  layerCount: number;
  onDelete: () => void;
  onUngroup: () => void;
}

const DeleteSubGroupDialog = ({
  open,
  onOpenChange,
  subGroupName,
  parentInterfaceGroup,
  layerCount,
  onDelete,
  onUngroup
}: DeleteSubGroupDialogProps) => {
  // If no layers, show simple confirmation
  if (layerCount === 0) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sub-Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{subGroupName}" sub-group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Sub-Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Main warning dialog with options
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sub-Group with Layers</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              The "{subGroupName}" sub-group contains {layerCount} layer{layerCount !== 1 ? 's' : ''}.
              What would you like to do?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button 
            variant="outline" 
            onClick={() => {
              onUngroup();
              onOpenChange(false);
            }}
          >
            Ungroup Layers (keep in {parentInterfaceGroup})
          </Button>
          <AlertDialogAction 
            onClick={onDelete} 
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete Sub-Group and {layerCount} Layer{layerCount !== 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteSubGroupDialog;
