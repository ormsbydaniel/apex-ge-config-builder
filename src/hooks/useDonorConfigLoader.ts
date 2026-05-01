import { useCallback } from 'react';
import { ConfigurationSchema } from '@/schemas/configSchema';
import { normalizeImportedConfig } from '@/utils/importTransformations';
import { formatValidationErrors, parseJSONWithLineNumbers } from '@/utils/validationUtils';
import { ValidationErrorDetails } from '@/types/config';

export type DonorSource =
  | { type: 'upload'; label: string }
  | { type: 'example'; label: string }
  | { type: 'github'; label: string }
  | { type: 'url'; label: string };

export type DonorLoadStage = 'idle' | 'parse' | 'normalize' | 'validate' | 'done';

export interface DonorLoadResult {
  success: boolean;
  config?: any;
  source?: DonorSource;
  errors?: ValidationErrorDetails[];
  errorMessage?: string;
}

export interface DonorLoadOptions {
  onStage?: (stage: DonorLoadStage) => void;
}

/**
 * Loads a configuration from file or URL purely for "donor" use (e.g. layer
 * import). Validates against ConfigurationSchema and normalises legacy shapes
 * via the existing import transformations, but **never** writes to
 * ConfigContext. Service capabilities are intentionally not fetched — the
 * donor is read-only.
 */
const validateAndNormalize = (
  text: string,
  source: DonorSource,
  onStage?: (s: DonorLoadStage) => void,
): DonorLoadResult => {
  onStage?.('parse');
  const { data: parsed, error: parseError } = parseJSONWithLineNumbers(text);
  if (parseError) {
    return {
      success: false,
      errorMessage:
        parseError.lineNumber !== undefined
          ? `Invalid JSON (line ${parseError.lineNumber}): ${parseError.message}`
          : `Invalid JSON: ${parseError.message}`,
    };
  }

  onStage?.('normalize');
  let normalized: any;
  try {
    normalized = normalizeImportedConfig(parsed);
  } catch (e: any) {
    return {
      success: false,
      errorMessage: `Failed to normalize configuration: ${e?.message || 'unknown error'}`,
    };
  }

  onStage?.('validate');
  const result = ConfigurationSchema.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      errors: formatValidationErrors(result.error, normalized),
    };
  }

  onStage?.('done');
  return { success: true, config: result.data, source };
};

export const useDonorConfigLoader = () => {
  const loadFromFile = useCallback(
    async (file: File, options: DonorLoadOptions = {}): Promise<DonorLoadResult> => {
      try {
        const text = await file.text();
        return validateAndNormalize(text, { type: 'upload', label: file.name }, options.onStage);
      } catch (e: any) {
        return {
          success: false,
          errorMessage: `Failed to read file: ${e?.message || 'unknown error'}`,
        };
      }
    },
    [],
  );

  const loadFromUrl = useCallback(
    async (
      url: string,
      source: DonorSource,
      options: DonorLoadOptions = {},
    ): Promise<DonorLoadResult> => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          return {
            success: false,
            errorMessage: `Failed to fetch configuration (HTTP ${res.status})`,
          };
        }
        const text = await res.text();
        return validateAndNormalize(text, source, options.onStage);
      } catch (e: any) {
        return {
          success: false,
          errorMessage: `Failed to fetch configuration: ${e?.message || 'unknown error'}`,
        };
      }
    },
    [],
  );

  return { loadFromFile, loadFromUrl };
};
