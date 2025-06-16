import { ZodError } from 'zod';
import { ValidationErrorDetails } from '@/types/config';

export const formatValidationErrors = (error: ZodError, configData?: any): ValidationErrorDetails[] => {
  return error.errors.map(err => {
    const path = err.path.join('.');
    const field = getFieldDisplayName(err.path, configData);
    
    return {
      field,
      message: getDetailedErrorMessage(err),
      code: err.code,
      path: err.path,
    };
  });
};

const getFieldDisplayName = (path: (string | number)[], configData?: any): string => {
  const pathStr = path.join('.');
  
  const fieldMappings: Record<string, string> = {
    'layout.navigation.logo': 'Logo URL',
    'layout.navigation.title': 'Application Title',
    'interfaceGroups': 'Interface Groups',
    'exclusivitySets': 'Exclusivity Sets',
    'services': 'Services',
    'sources': 'Data Sources',
    'version': 'Configuration Version',
  };

  // Enhanced data source name extraction
  const dataSourcePatterns = [
    { pattern: /^sources\.(\d+)$/, label: (match: RegExpMatchArray) => {
      const index = parseInt(match[1]);
      const sourceName = getDataSourceName(configData, index);
      return sourceName ? `Data Source "${sourceName}"` : `Data Source ${index + 1}`;
    }},
    { pattern: /^sources\.(\d+)\.(.+)$/, label: (match: RegExpMatchArray) => {
      const index = parseInt(match[1]);
      const field = match[2];
      const sourceName = getDataSourceName(configData, index);
      const sourceLabel = sourceName ? `"${sourceName}"` : `${index + 1}`;
      return getSourceFieldLabel(field, sourceLabel);
    }},
  ];

  // Check for data source patterns first
  for (const { pattern, label } of dataSourcePatterns) {
    const match = pathStr.match(pattern);
    if (match) {
      return label(match);
    }
  }

  // Check for other array indices with more descriptive names
  const arrayPatterns = [
    { pattern: /^services\.(\d+)\.name$/, label: (match: RegExpMatchArray) => `Service ${parseInt(match[1]) + 1} Name` },
    { pattern: /^services\.(\d+)\.url$/, label: (match: RegExpMatchArray) => `Service ${parseInt(match[1]) + 1} URL` },
    { pattern: /^services\.(\d+)\.id$/, label: (match: RegExpMatchArray) => `Service ${parseInt(match[1]) + 1} ID` },
    { pattern: /^services\.(\d+)\.format$/, label: (match: RegExpMatchArray) => `Service ${parseInt(match[1]) + 1} Format` },
  ];

  for (const { pattern, label } of arrayPatterns) {
    const match = pathStr.match(pattern);
    if (match) {
      return label(match);
    }
  }

  return fieldMappings[pathStr] || pathStr || 'Unknown field';
};

const getDataSourceName = (configData: any, index: number): string | null => {
  if (!configData?.sources?.[index]) return null;
  return configData.sources[index].name || null;
};

const getSourceFieldLabel = (field: string, sourceLabel: string): string => {
  const fieldMappings: Record<string, string> = {
    'name': 'Name',
    'data': 'Data Configuration',
    'meta.description': 'Description',
    'meta.attribution.text': 'Attribution Text',
    'meta.attribution.url': 'Attribution URL',
    'layout.interfaceGroup': 'Interface Group',
    'layout.layerCard': 'Layer Card Configuration',
    'layout.layerCard.toggleable': 'Toggleable Setting',
    'layout.layerCard.legend': 'Legend Configuration',
    'layout.layerCard.controls': 'Controls Configuration',
  };

  const mappedField = fieldMappings[field] || field;
  return `Data Source ${sourceLabel} ${mappedField}`;
};

const getDetailedErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'invalid_type':
      if (error.expected === 'string' && error.received === 'undefined') {
        return 'This field is required but is missing or empty';
      }
      if (error.expected === 'array' && error.received === 'object') {
        return 'Expected an array but received an object. Check that this field contains a list of items enclosed in square brackets [ ]';
      }
      if (error.expected === 'object' && error.received === 'array') {
        return 'Expected an object but received an array. Check that this field contains a single object enclosed in curly braces { }';
      }
      return `Expected ${error.expected} but received ${error.received}. Check the data type for this field`;
    
    case 'invalid_string':
      if (error.validation === 'url') {
        return 'Must be a valid URL starting with http:// or https://, or a valid relative path starting with /, ./, or ../';
      }
      return 'Invalid text format. Check for special characters or encoding issues';
    
    case 'too_small':
      if (error.type === 'string') {
        return `Text must be at least ${error.minimum} characters long`;
      }
      if (error.type === 'array') {
        return `Array must contain at least ${error.minimum} item(s)`;
      }
      return `Value must be at least ${error.minimum}`;
    
    case 'invalid_enum_value':
      return `Invalid value. Must be one of: ${error.options.join(', ')}`;
    
    case 'invalid_union':
      return 'Data structure does not match any of the expected formats. Check the configuration schema documentation';
    
    case 'custom':
      return error.message || 'Custom validation failed';
    
    default:
      return error.message || 'Invalid value. Please check the configuration documentation for the correct format';
  }
};

export const categorizeErrors = (errors: ValidationErrorDetails[]) => {
  const categories = {
    layout: errors.filter(err => err.path[0] === 'layout'),
    services: errors.filter(err => err.path[0] === 'services'),
    sources: errors.filter(err => err.path[0] === 'sources'),
    general: errors.filter(err => !['layout', 'services', 'sources'].includes(err.path[0] as string)),
  };

  return categories;
};

// Enhanced JSON parsing with line number extraction
export interface JSONParseError extends Error {
  lineNumber?: number;
  columnNumber?: number;
  position?: number;
}

export const parseJSONWithLineNumbers = (jsonString: string): { data?: any; error?: JSONParseError } => {
  try {
    const data = JSON.parse(jsonString);
    return { data };
  } catch (error) {
    const enhanced = error as JSONParseError;
    
    // Try to extract line number from error message
    const lineMatch = enhanced.message.match(/line (\d+)/i);
    const positionMatch = enhanced.message.match(/position (\d+)/i);
    
    if (lineMatch) {
      enhanced.lineNumber = parseInt(lineMatch[1], 10);
    }
    
    if (positionMatch) {
      enhanced.position = parseInt(positionMatch[1], 10);
      // Calculate approximate line number from position
      if (!enhanced.lineNumber && enhanced.position) {
        const lines = jsonString.substring(0, enhanced.position).split('\n');
        enhanced.lineNumber = lines.length;
        enhanced.columnNumber = lines[lines.length - 1].length + 1;
      }
    }
    
    return { error: enhanced };
  }
};
