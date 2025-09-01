
import { useCallback } from 'react';
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

  const importConfig = useCallback(async (file: File): Promise<{ success: boolean; errors?: ValidationErrorDetails[]; jsonError?: any }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const text = await file.text();
      
      // Enhanced JSON parsing with line number detection
      const parseResult = parseJSONWithLineNumbers(text);
      
      if (parseResult.error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        
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
      
      
      // IMPORTANT: Normalize imported config BEFORE validation
      // This converts external format (e.g., swipe data objects) to internal format
      const normalizedData = normalizeImportedConfig(jsonData);
      
      
      // Validate the normalized configuration using Zod schema
      const validatedConfig = ConfigurationSchema.parse(normalizedData);
      
      
      // Fetch capabilities for all services if they exist
      const servicesWithCapabilities = await Promise.all(
        (validatedConfig.services || []).map(async (service) => {
          // Handle S3 services differently - don't fetch GetCapabilities for them
          if (service.sourceType === 's3') {
            try {
              // Import S3 utilities
              const { fetchS3BucketContents } = await import('@/utils/s3Utils');
              const s3Objects = await fetchS3BucketContents(service.url);
              
              // Convert S3 objects to layer format for compatibility
              const layers = s3Objects.map(obj => ({
                name: obj.key,
                title: obj.key,
                abstract: `S3 object: ${obj.key} (${(obj.size / 1024).toFixed(1)} KB)`
              }));
              
              return {
                ...service,
                capabilities: {
                  layers,
                  title: service.name,
                  abstract: `S3 bucket with ${layers.length} objects`
                }
              };
            } catch (error) {
              console.warn(`Failed to fetch S3 bucket contents for ${service.name}:`, error);
              return service;
            }
          } else {
            // For non-S3 services, fetch normal capabilities
            const capabilities = await fetchServiceCapabilities(service.url, service.format);
            return {
              ...service,
              ...(capabilities && { capabilities })
            };
          }
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
    }
  }, [dispatch, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConfig(file);
    }
  }, [importConfig]);

  return { importConfig, handleFileSelect };
};
