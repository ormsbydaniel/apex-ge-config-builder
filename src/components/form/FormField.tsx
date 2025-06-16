
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createFormFieldHandler, validateFormField } from '@/utils/formHelpers';

interface BaseFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'url' | 'number';
  value: string;
  onChange: (field: string, value: string) => void;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (field: string, value: string) => void;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (field: string, value: string) => void;
  options: Array<{ value: string; label: string }>;
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps;

const FormField = (props: FormFieldProps) => {
  const { id, name, label, placeholder, required = false, className, autoComplete } = props;
  
  const isValid = validateFormField(props.value, required);
  const fieldClass = `${className || ''} ${!isValid && required ? 'border-destructive' : ''}`;

  const handleChange = createFormFieldHandler(
    (value: string) => props.onChange(name, value)
  );

  const renderField = () => {
    switch (props.type) {
      case 'textarea':
        return (
          <Textarea
            id={id}
            name={name}
            value={props.value}
            onChange={handleChange}
            placeholder={placeholder}
            className={fieldClass}
            rows={props.rows || 3}
            autoComplete={autoComplete}
          />
        );
      
      case 'select':
        return (
          <Select value={props.value} onValueChange={(value) => props.onChange(name, value)}>
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            id={id}
            name={name}
            type={props.type}
            value={props.value}
            onChange={handleChange}
            placeholder={placeholder}
            className={fieldClass}
            autoComplete={autoComplete}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={required ? 'after:content-["*"] after:text-destructive after:ml-1' : ''}>
        {label}
      </Label>
      {renderField()}
      {!isValid && required && (
        <p className="text-sm text-destructive">This field is required</p>
      )}
    </div>
  );
};

export default FormField;
