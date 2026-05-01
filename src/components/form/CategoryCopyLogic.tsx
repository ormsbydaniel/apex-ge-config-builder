import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/config';
import { CategoryBadgeList } from './CategoryPreview';

interface CategoryAppendReplaceDialogProps {
  open: boolean;
  localCategoriesCount: number;
  pendingCopyData: { categories: Category[]; hasValues: boolean; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onChoose: (mode: 'append' | 'replace') => void;
}

const CategoryCopyLogic = ({
  open,
  localCategoriesCount,
  pendingCopyData,
  onOpenChange,
  onChoose,
}: CategoryAppendReplaceDialogProps) => {
  const incoming = pendingCopyData?.categories.length ?? 0;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add categories</AlertDialogTitle>
          <AlertDialogDescription>
            You have {localCategoriesCount} existing categories. How would you like to add the{' '}
            {incoming} categories from "{pendingCopyData?.name}"?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {pendingCopyData && incoming > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Preview from "{pendingCopyData.name}" ({incoming})
            </p>
            <div className="rounded-md border bg-muted/30 p-2 max-h-32 overflow-y-auto">
              <CategoryBadgeList
                categories={pendingCopyData.categories}
                useValues={pendingCopyData.hasValues}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={() => onChoose('append')}>
            Add to existing ({localCategoriesCount + incoming} total)
          </Button>
          <AlertDialogAction
            onClick={() => onChoose('replace')}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Replace all ({incoming} total)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategoryCopyLogic;
