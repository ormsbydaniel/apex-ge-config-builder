import { ZodError } from 'zod';
import { ValidationErrorDetails } from '@/types/config';

export const formatValidationErrors = (error: ZodError, configData?: any): ValidationErrorDetails[] => {
  return error.errors.map(err => {
    const path = err.path.join('.');
    const field = getFieldDisplayName(err.path, configData);
    
    // Enhanced union error handling
    if (err.code === 'invalid_union') {
      const enhancedMessage = getEnhancedUnionErrorMessage(err, err.path, configData);
      return {
        field,
        message: enhancedMessage,
        code: err.code,
        path: err.path,
      };
    }
    
    return {
      field,
      message: getDetailedErrorMessage(err),
      code: err.code,
      path: err.path,
    };
  });
};

const getEnhancedUnionErrorMessage = (error: any, path: (string | number)[], configData?: any): string => {
  // Check if this is a data source validation error
  if (path.length >= 2 && path[0] === 'sources' && typeof path[1] === 'number') {
    const sourceIndex = path[1] as number;
    const sourceName = getDataSourceName(configData, sourceIndex);
    const sourceData = configData?.sources?.[sourceIndex];
    
    if (sourceData) {
      return analyzeDataSourceValidationFailure(sourceData, sourceName || `Source ${sourceIndex + 1}`);
    }
  }
  
  // Generic union error handling with sub-error analysis
  if (error.unionErrors && Array.isArray(error.unionErrors)) {
    const commonIssues = analyzeUnionSubErrors(error.unionErrors);
    if (commonIssues.length > 0) {
      return `Data structure validation failed. Common issues found: ${commonIssues.join(', ')}. Check the configuration schema documentation for the correct format.`;
    }
  }
  
  return 'Data structure does not match any of the expected formats. Check the configuration schema documentation';
};

const detectSwipeLayerFromInput = (sourceData: any): boolean => {
  
  // Check for swipe layer indicators in input format (before transformation)
  if (sourceData.data && typeof sourceData.data === 'object' && !Array.isArray(sourceData.data)) {
    
    // Direct swipe type indicator
    if (sourceData.data.type === 'swipe') {
      return true;
    }
    
    
    // Swipe-specific fields
    if (sourceData.data.clippedSource && sourceData.data.baseSources) {
      return true;
    }
  }
  
  // Check for already transformed swipe layer
  
  if (sourceData.meta?.swipeConfig) {
    return true;
  }
  
  return false;
};

const analyzeDataSourceValidationFailure = (sourceData: any, sourceName: string): string => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check basic required fields
  if (!sourceData.name || typeof sourceData.name !== 'string') {
    issues.push('missing or invalid name field');
  }
  
  if (sourceData.isActive === undefined || typeof sourceData.isActive !== 'boolean') {
    issues.push('missing or invalid isActive field (must be boolean)');
  }
  
  if (!sourceData.data || (!Array.isArray(sourceData.data) && typeof sourceData.data !== 'object')) {
    issues.push('missing or invalid data field (must be array or object)');
  }
  
  // Determine what type of data source this should be
  const isBaseLayer = sourceData.isBaseLayer === true;
  const isSwipeLayer = detectSwipeLayerFromInput(sourceData);
  const hasMeta = sourceData.meta && typeof sourceData.meta === 'object';
  const hasLayout = sourceData.layout && typeof sourceData.layout === 'object';
  
  if (isSwipeLayer) {
    // Swipe layer validation - more permissive during import
    suggestions.push('This appears to be a swipe layer (has swipe indicators)');
    
    // For swipe layers, we're more permissive about meta/layout requirements during import
    // since they may be in the process of being transformed
    if (sourceData.data && typeof sourceData.data === 'object' && sourceData.data.type === 'swipe') {
      // Input format swipe layer - check required swipe fields
      if (!sourceData.data.clippedSource) {
        issues.push('data.clippedSource is required for swipe layers');
      }
      if (!sourceData.data.baseSources || !Array.isArray(sourceData.data.baseSources)) {
        issues.push('data.baseSources must be an array for swipe layers');
      }
      
      // Meta and layout are optional during import for swipe layers as they get auto-generated
      suggestions.push('Meta and layout will be auto-generated during import if missing');
    } else if (Array.isArray(sourceData.data) && sourceData.meta?.swipeConfig) {
      // Already transformed swipe layer
      if (!sourceData.meta.swipeConfig.clippedSourceName) {
        issues.push('meta.swipeConfig.clippedSourceName is required');
      }
      if (!sourceData.meta.swipeConfig.baseSourceNames || !Array.isArray(sourceData.meta.swipeConfig.baseSourceNames)) {
        issues.push('meta.swipeConfig.baseSourceNames must be an array');
      }
      if (!hasMeta || !sourceData.meta.description) {
        issues.push('meta.description is required for transformed swipe layers');
      }
      if (!hasMeta || !sourceData.meta.attribution?.text) {
        issues.push('meta.attribution.text is required for transformed swipe layers');
      }
    }
  } else if (isBaseLayer) {
    // Base layer validation
    suggestions.push('This appears to be a base layer (isBaseLayer: true)');
    if (hasMeta && !sourceData.meta.description) {
      issues.push('meta.description is required when meta is provided');
    }
    if (hasMeta && (!sourceData.meta.attribution || !sourceData.meta.attribution.text)) {
      issues.push('meta.attribution.text is required when meta is provided');
    }
  } else {
    // Regular layer card validation
    suggestions.push('This appears to be a layer card (regular data source)');
    if (!hasMeta) {
      issues.push('meta field is required for layer cards');
    } else {
      if (!sourceData.meta.description) {
        issues.push('meta.description is required');
      }
      if (!sourceData.meta.attribution?.text) {
        issues.push('meta.attribution.text is required');
      }
    }
    if (!hasLayout) {
      issues.push('layout field is required for layer cards');
    }
  }
  
  // Check data field structure (only for non-swipe or transformed swipe layers)
  if (sourceData.data && !isSwipeLayer) {
    if (Array.isArray(sourceData.data)) {
      sourceData.data.forEach((item: any, index: number) => {
        if (!item.format) {
          issues.push(`data[${index}].format is required`);
        }
        if (item.zIndex === undefined) {
          issues.push(`data[${index}].zIndex is required (number)`);
        }
        if (!item.url && (!item.images || !Array.isArray(item.images) || item.images.length === 0)) {
          issues.push(`data[${index}] must have either 'url' or 'images' array`);
        }
      });
    } else if (typeof sourceData.data === 'object') {
      if (!sourceData.data.format) {
        issues.push('data.format is required');
      }
      if (sourceData.data.zIndex === undefined) {
        issues.push('data.zIndex is required (number)');
      }
      if (!sourceData.data.url && (!sourceData.data.images || !Array.isArray(sourceData.data.images) || sourceData.data.images.length === 0)) {
        issues.push('data must have either \'url\' or \'images\' array');
      }
    }
  }
  
  let message = `"${sourceName}" validation failed.`;
  
  if (suggestions.length > 0) {
    message += ` ${suggestions[0]}.`;
  }
  
  if (issues.length > 0) {
    message += ` Issues found: ${issues.join(', ')}.`;
  }
  
  // Add specific guidance based on the type
  if (isSwipeLayer) {
    message += ' For swipe layers during import: data.type="swipe", data.clippedSource, and data.baseSources are required. Meta and layout will be auto-generated if missing.';
  } else if (isBaseLayer) {
    message += ' For base layers: meta and layout are optional, but if provided, meta.description and meta.attribution.text are required.';
  } else {
    message += ' For layer cards: meta (with description and attribution) and layout are required.';
  }
  
  return message;
};

const analyzeUnionSubErrors = (unionErrors: any[]): string[] => {
  const commonIssues: string[] = [];
  const issueCounts: Record<string, number> = {};
  
  // Analyze all sub-errors to find common patterns
  unionErrors.forEach(subError => {
    if (subError.errors && Array.isArray(subError.errors)) {
      subError.errors.forEach((err: any) => {
        let issueKey = '';
        
        if (err.code === 'invalid_type') {
          issueKey = `${err.path?.join?.('.') || 'field'} should be ${err.expected} but got ${err.received}`;
        } else if (err.code === 'invalid_string') {
          issueKey = `${err.path?.join?.('.') || 'field'} has invalid format`;
        } else if (err.code === 'too_small') {
          issueKey = `${err.path?.join?.('.') || 'field'} is too small (minimum: ${err.minimum})`;
        } else if (err.message) {
          issueKey = err.message;
        }
        
        if (issueKey) {
          issueCounts[issueKey] = (issueCounts[issueKey] || 0) + 1;
        }
      });
    }
  });
  
  // Return the most common issues (appearing in multiple union attempts)
  Object.entries(issueCounts).forEach(([issue, count]) => {
    if (count >= 2) { // Issue appears in multiple union validation attempts
      commonIssues.push(issue);
    }
  });
  
  return commonIssues.slice(0, 3); // Limit to top 3 issues
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
      return 'Data structure does not match any of the expected formats. Check the configuration schema documentation for the correct format';
    
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
