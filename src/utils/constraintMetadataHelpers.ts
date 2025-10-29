import { fetchCogMetadata, CogMetadata } from './cogMetadata';
import { ConstraintSourceItem } from '@/types/config';

export interface ConstraintMetadataSuggestions {
  type: 'continuous' | 'categorical';
  min?: number;
  max?: number;
  units?: string;
  constrainTo?: Array<{ label: string; value: number }>;
}

/**
 * Fetch COG metadata and generate constraint field suggestions
 */
export async function populateConstraintFromCogMetadata(url: string): Promise<ConstraintMetadataSuggestions> {
  try {
    const metadata = await fetchCogMetadata(url);
    
    // Determine constraint type based on data nature
    const type = determineConstraintType(metadata);
    
    if (type === 'continuous') {
      return {
        type: 'continuous',
        min: metadata.minValue,
        max: metadata.maxValue,
        units: '', // User must provide units
      };
    } else {
      // Categorical
      const constrainTo = generateConstrainToValues(metadata);
      return {
        type: 'categorical',
        constrainTo,
      };
    }
  } catch (error) {
    throw new Error(`Failed to populate constraint from COG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Determine if constraint should be continuous or categorical based on metadata
 */
function determineConstraintType(metadata: CogMetadata): 'continuous' | 'categorical' {
  // Use dataNature if available
  if (metadata.dataNature === 'continuous') {
    return 'continuous';
  }
  
  if (metadata.dataNature === 'categorical') {
    return 'categorical';
  }
  
  // Fallback heuristic: if uniqueValues exist and are few, assume categorical
  if (metadata.uniqueValues && metadata.uniqueValues.length > 0 && metadata.uniqueValues.length < 50) {
    return 'categorical';
  }
  
  // Default to continuous if uncertain
  return 'continuous';
}

/**
 * Generate constrainTo array from unique values in metadata
 */
function generateConstrainToValues(metadata: CogMetadata): Array<{ label: string; value: number }> {
  if (!metadata.uniqueValues || metadata.uniqueValues.length === 0) {
    return [];
  }
  
  // Sort unique values
  const sortedValues = [...metadata.uniqueValues].sort((a, b) => a - b);
  
  // Generate label/value pairs
  return sortedValues.map((value) => ({
    label: `Category ${value}`, // Default label, user can customize
    value,
  }));
}

/**
 * Validate a constraint source item
 */
export function validateConstraintSource(constraint: Partial<ConstraintSourceItem>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!constraint.url) {
    errors.push('URL is required');
  }
  
  if (constraint.format !== 'cog') {
    errors.push('Only COG format is supported for constraints');
  }
  
  if (!constraint.label) {
    errors.push('Label is required');
  }
  
  if (!constraint.type) {
    errors.push('Type is required');
  }
  
  if (constraint.type === 'continuous') {
    if (constraint.min === undefined) {
      errors.push('Min value is required for continuous constraints');
    }
    if (constraint.max === undefined) {
      errors.push('Max value is required for continuous constraints');
    }
    if (constraint.min !== undefined && constraint.max !== undefined && constraint.min >= constraint.max) {
      errors.push('Min value must be less than max value');
    }
  }
  
  if (constraint.type === 'categorical') {
    if (!constraint.constrainTo || constraint.constrainTo.length === 0) {
      errors.push('At least one category is required for categorical constraints');
    }
    // Validate categorical format
    if (constraint.constrainTo) {
      for (const item of constraint.constrainTo) {
        if ('value' in item && item.value === undefined) {
          errors.push('All categories must have a value');
        }
      }
    }
  }
  
  if (constraint.type === 'combined') {
    if (!constraint.constrainTo || constraint.constrainTo.length === 0) {
      errors.push('At least one named range is required for combined constraints');
    }
    // Validate combined format
    if (constraint.constrainTo) {
      for (let i = 0; i < constraint.constrainTo.length; i++) {
        const item = constraint.constrainTo[i];
        if (!('min' in item) || !('max' in item)) {
          errors.push(`Range ${i + 1}: Must have min and max values`);
          continue;
        }
        if (item.min === undefined) {
          errors.push(`Range ${i + 1}: Min value is required`);
        }
        if (item.max === undefined) {
          errors.push(`Range ${i + 1}: Max value is required`);
        }
        if (item.min !== undefined && item.max !== undefined && item.min >= item.max) {
          errors.push(`Range ${i + 1}: Min must be less than max`);
        }
        if (!item.label || item.label.trim() === '') {
          errors.push(`Range ${i + 1}: Label is required`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
