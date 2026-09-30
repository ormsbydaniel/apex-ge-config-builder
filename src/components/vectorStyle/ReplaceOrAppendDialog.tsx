import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { RecipeApplyMode } from '@/utils/vectorStyle/recipes';

interface Props {
  open: boolean;
  existingCount: number;
  onChoose: (mode: RecipeApplyMode) => void;
  onCancel: () => void;
}

const ReplaceOrAppendDialog = ({ open, existingCount, onChoose, onCancel }: Props) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>This layer already has style rules</AlertDialogTitle>
        <AlertDialogDescription>
          There {existingCount === 1 ? 'is 1 rule' : `are ${existingCount} rules`} already. Replace them with the recipe, or add the recipe's rules after them?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button variant="outline" onClick={() => onChoose('append')}>Append</Button>
        <Button variant="destructive" onClick={() => onChoose('replace')}>Replace</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ReplaceOrAppendDialog;
