
import { useState } from 'react';
import { ValidationErrorDetails } from '@/types/config';

export const useValidationErrors = () => {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetails[]>([]);
  const [jsonError, setJsonError] = useState<any>(null);

  const showErrors = (errors: ValidationErrorDetails[], jsonErr?: any) => {
    setValidationErrors(errors);
    setJsonError(jsonErr || null);
    setShowErrorDialog(true);
  };

  const clearErrors = () => {
    setValidationErrors([]);
    setJsonError(null);
    setShowErrorDialog(false);
  };

  return {
    showErrorDialog,
    validationErrors,
    jsonError,
    setShowErrorDialog,
    showErrors,
    clearErrors
  };
};
