
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfigurationSchema } from '@/schemas/configSchema';
import { useConfig } from '@/contexts/ConfigContext';
import { formatValidationErrors, parseJSONWithLineNumbers } from '@/utils/validationUtils';
import { ValidationErrorDetails, DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { normalizeImportedConfig, detectTransformations } from '@/utils/importTransformations';
import { parseS3Url } from '@/utils/s3Utils';

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
      let validatedConfig;
      try {
        validatedConfig = ConfigurationSchema.parse(normalizedData);
      } catch (zodError: any) {
        console.error('[VALIDATION ERROR] Full Zod error:', JSON.stringify(zodError.errors, null, 2));
        console.error('[VALIDATION ERROR] Affected sources:', normalizedData.sources?.map((s: any) => ({ name: s.name, isBaseLayer: s.isBaseLayer, hasMeta: !!s.meta, hasLayout: !!s.layout })));
        
        // Log the specific failing sources in detail
        const failingIndices = zodError.errors
          .map((err: any) => err.path?.[1])
          .filter((idx: any) => typeof idx === 'number');
        
        failingIndices.forEach((idx: number) => {
          const source = normalizedData.sources?.[idx];
          if (source) {
            console.error(`[VALIDATION ERROR] Source ${idx} (${source.name}):`, {
              isBaseLayer: source.isBaseLayer,
              hasMeta: !!source.meta,
              hasLayout: !!source.layout,
              layoutKeys: source.layout ? Object.keys(source.layout) : [],
              layoutContent: source.layout
            });
          }
        });
        
        throw zodError;
      }
      
      
      // Fetch capabilities for all services if they exist.
      // S3 services (detected by sourceType or URL pattern) are skipped during import —
      // bucket listing is only needed when interactively browsing, not at load time.
      const servicesWithCapabilities = await Promise.all(
        (validatedConfig.services || []).map(async (service) => {
          const isS3Service = service.sourceType === 's3' || parseS3Url(service.url) !== null;
          const isSkippedFormat = service.format === 's3' || service.format === 'stac';

          if (isS3Service || isSkippedFormat) {
            // Skip S3 bucket listing and STAC services during import — not needed at load time
            return service;
          } else if (service.format) {
            const capabilities = await fetchServiceCapabilities(service.url, service.format as DataSourceFormat);
            return {
              ...service,
              ...(capabilities && { capabilities })
            };
          } else {
            return service;
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

  const importConfigFromUrl = useCallback(async (url: string): Promise<{ success: boolean; errors?: ValidationErrorDetails[]; jsonError?: any }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const text = await response.text();
      
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
      const normalizedData = normalizeImportedConfig(jsonData);
      
      // Validate the normalized configuration using Zod schema
      let validatedConfig;
      try {
        validatedConfig = ConfigurationSchema.parse(normalizedData);
      } catch (zodError: any) {
        console.error('[VALIDATION ERROR] Full Zod error:', JSON.stringify(zodError.errors, null, 2));
        throw zodError;
      }
      
      // Fetch capabilities for all services if they exist
      const servicesWithCapabilities = await Promise.all(
        (validatedConfig.services || []).map(async (service) => {
          const isS3Service = service.sourceType === 's3' || parseS3Url(service.url) !== null;
          const isSkippedFormat = service.format === 's3' || service.format === 'stac';

          if (isS3Service || isSkippedFormat) {
            return service;
          } else if (service.format) {
            const capabilities = await fetchServiceCapabilities(service.url, service.format as DataSourceFormat);
            return {
              ...service,
              ...(capabilities && { capabilities })
            };
          } else {
            return service;
          }
        })
      );
      
      const configWithCapabilities = {
        ...validatedConfig,
        services: servicesWithCapabilities
      };
      
      dispatch({ type: 'LOAD_CONFIG', payload: configWithCapabilities });
      
      // Enhanced success message with transformation details
      const transformationCount = Object.values(detectedTransforms).filter(Boolean).length;
      
      let description = 'Successfully loaded example configuration';
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
        const formattedErrors = formatValidationErrors(error as any, null);
        
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
          description: error instanceof Error ? error.message : "An unexpected error occurred while loading the configuration.",
          variant: "destructive",
        });
        return { success: false };
      }
    }
  }, [dispatch, toast]);

  return { importConfig, handleFileSelect, importConfigFromUrl };
};
