
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfigurationSchema } from '@/schemas/configSchema';
import { useConfig } from '@/contexts/ConfigContext';
import { formatValidationErrors, parseJSONWithLineNumbers } from '@/utils/validationUtils';
import { ValidationErrorDetails } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { normalizeImportedConfig, detectTransformations } from '@/utils/importTransformations';

export const useConfigImport = () => {
  const { dispatch } = useConfig();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  const importConfig = useCallback(async (file: File): Promise<{ success: boolean; errors?: ValidationErrorDetails[]; jsonError?: any }> => {
    try {
      setIsImporting(true);
      dispatch({ type: 'SET_LOADING', payload: true });

      const text = await file.text();
      
      // Enhanced JSON parsing with line number detection
      const parseResult = parseJSONWithLineNumbers(text);
      
      if (parseResult.error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsImporting(false);
        
        const errorMessage = parseResult.error.lineNumber 
          ? `Invalid JSON at line ${parseResult.error.lineNumber}${parseResult.error.columnNumber ? `, column ${parseResult.error.columnNumber}` : ''}: ${parseResult.error.message}`
          : `Invalid JSON: ${parseResult.error.message}`;
        
        toast({
          title: "JSON Parse Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, jsonError: parseResult.error };
      }
      
      const jsonData = parseResult.data;
      
      // Detect transformations before normalization for better user feedback
      const detectedTransforms = detectTransformations(jsonData);
      console.log('Import: Detected transformations:', detectedTransforms);
      
      // IMPORTANT: Normalize imported config BEFORE validation
      // This converts external format (e.g., swipe data objects) to internal format
      const normalizedData = normalizeImportedConfig(jsonData);
      console.log('Import: Data normalized, now validating with Zod schema');
      
      // Validate the normalized configuration using Zod schema
      const validatedConfig = ConfigurationSchema.parse(normalizedData);
      console.log('Import: Zod validation successful');
      
      // Fetch capabilities for all services if they exist
      const servicesWithCapabilities = await Promise.all(
        (validatedConfig.services || []).map(async (service) => {
          const capabilities = await fetchServiceCapabilities(service.url, service.format);
          return {
            ...service,
            ...(capabilities && { capabilities })
          };
        })
      );
      
      // Load the validated configuration with capabilities
      const configWithCapabilities = {
        ...validatedConfig,
        services: servicesWithCapabilities
      };
      
      dispatch({ type: 'LOAD_CONFIG', payload: configWithCapabilities });
      
      // Enhanced success message with transformation details
      const transformationCount = Object.values(detectedTransforms).filter(Boolean).length;
      
      let description = `Successfully loaded configuration from ${file.name}`;
      if (transformationCount > 0) {
        const transformationTypes = [];
        if (detectedTransforms.singleItemArrayToObject) transformationTypes.push('array/object');
        if (detectedTransforms.configureCogsAsImages) transformationTypes.push('COG images');
        if (detectedTransforms.transformSwipeLayersToData) transformationTypes.push('swipe layers');
        
        description += `. Export transformations (${transformationTypes.join(', ')}) were automatically reversed.`;
      }
      
      toast({
        title: "Configuration Loaded",
        description,
      });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsImporting(false);
      
      if (error instanceof Error && error.name === 'ZodError') {
        // Format validation errors for detailed display with config data context
        // Note: We need to get the original data for error context, not the normalized data
        const parseResult = parseJSONWithLineNumbers(await file.text());
        const formattedErrors = formatValidationErrors(error as any, parseResult?.data);
        
        toast({
          title: "Invalid Configuration",
          description: `Found ${formattedErrors.length} validation error${formattedErrors.length !== 1 ? 's' : ''}. See details for specific issues.`,
          variant: "destructive",
        });
        
        return { success: false, errors: formattedErrors };
      } else {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: "An unexpected error occurred while importing the configuration.",
          variant: "destructive",
        });
        return { success: false };
      }
    } finally {
      setIsImporting(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConfig(file);
    }
  }, [importConfig]);

  return { importConfig, handleFileSelect, isImporting };
};
