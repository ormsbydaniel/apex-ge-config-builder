/**
 * Validation result type definitions
 */

export interface ValidationErrorDetails {
  field: string;
  message: string;
  code: string;
  path: (string | number)[];
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetails[];
  config?: any;
}

// URL and Layer Validation Types
export interface UrlValidationResult {
  url: string;
  type: 'data' | 'statistics';
  format?: string;
  layers?: string;
  status: 'valid' | 'error' | 'checking' | 'not-validated' | 'skipped';
  statusCode?: number;
  error?: string;
  validationType?: 'head-request' | 'get-capabilities' | 'skipped' | 'service-lookup';
}

export interface LayerValidationResult {
  layerName: string;
  overallStatus: 'valid' | 'partial' | 'error' | 'checking' | 'not-validated';
  urlResults: UrlValidationResult[];
  checkedAt?: Date;
}
