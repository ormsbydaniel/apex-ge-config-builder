
export { validateFormField, sanitizeFormValue, createFormFieldHandler, handleKeyPress } from './formHelpers';

export const createFieldValidator = (type: 'required' | 'url' | 'number' | 'email', customMessage?: string) => {
  return (value: any): { isValid: boolean; message?: string } => {
    switch (type) {
      case 'required':
        const isValid = Boolean(value && String(value).trim());
        return {
          isValid,
          message: isValid ? undefined : customMessage || 'This field is required'
        };
      
      case 'url':
        const urlPattern = /^https?:\/\/.+/;
        const isValidUrl = !value || urlPattern.test(String(value));
        return {
          isValid: isValidUrl,
          message: isValidUrl ? undefined : customMessage || 'Please enter a valid URL'
        };
      
      case 'number':
        const isValidNumber = !value || !isNaN(Number(value));
        return {
          isValid: isValidNumber,
          message: isValidNumber ? undefined : customMessage || 'Please enter a valid number'
        };
      
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = !value || emailPattern.test(String(value));
        return {
          isValid: isValidEmail,
          message: isValidEmail ? undefined : customMessage || 'Please enter a valid email address'
        };
      
      default:
        return { isValid: true };
    }
  };
};

export const combineValidators = (...validators: Array<(value: any) => { isValid: boolean; message?: string }>) => {
  return (value: any) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
};
