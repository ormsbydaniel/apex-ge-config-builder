
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import ValidationErrorDetailsComponent from '../../ValidationErrorDetails';
import { ValidationErrorDetails } from '@/types/config';

interface ValidationErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationErrorDetails[];
  jsonError?: any;
}

const ValidationErrorDialog = ({ 
  open, 
  onOpenChange, 
  errors, 
  jsonError 
}: ValidationErrorDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            JSON Validation Errors
          </DialogTitle>
          <DialogDescription>
            The edited JSON contains errors that prevent it from being applied. Review the details below to understand what needs to be fixed.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ValidationErrorDetailsComponent 
            errors={errors}
            fileName="manual-edit.json"
            jsonError={jsonError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationErrorDialog;
