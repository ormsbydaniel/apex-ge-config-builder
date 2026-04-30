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
  status: 'valid' | 'error' | 'checking' | 'not-validated' | 'skipped' | 'performance-warning';
  statusCode?: number;
  error?: string;
  validationType?: 'head-request' | 'get-capabilities' | 'skipped' | 'service-lookup';
  /** Human-readable performance warning (e.g. "Large file: 7.2 MB"). Present when status is 'performance-warning'. */
  warning?: string;
  /** Payload size in bytes when known (from Content-Length). */
  bytes?: number;
}

export interface LayerValidationResult {
  layerName: string;
  overallStatus: 'valid' | 'partial' | 'error' | 'checking' | 'not-validated' | 'performance-warning';
  urlResults: UrlValidationResult[];
  checkedAt?: Date;
}
