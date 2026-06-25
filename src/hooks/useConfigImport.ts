
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfigurationSchema } from '@/schemas/configSchema';
import { useConfig } from '@/contexts/ConfigContext';
import { formatValidationErrors, parseJSONWithLineNumbers } from '@/utils/validationUtils';
import { ValidationErrorDetails, DataSourceFormat, Service } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { normalizeImportedConfig, detectTransformations } from '@/utils/importTransformations';
import { parseS3Url } from '@/utils/s3Utils';
import { loadCatalogue } from '@/lib/catalogue/apexCatalogue';
import type { LoadedConfigSource } from '@/contexts/ConfigContext';

/**
 * For any workflow entry missing serviceTitle, look up the default APEx
 * Algorithm Catalogue and back-fill the title when a matching record is found.
 * Never throws — catalogue failures leave the config untouched.
 */
async function enrichWorkflowsWithCatalogueTitles(
  config: any,
): Promise<{ config: any; filled: number }> {
  const hasMissing = (workflows: any[] | undefined): boolean =>
    Array.isArray(workflows) &&
    workflows.some(
      (w) => w && (!w.serviceTitle || String(w.serviceTitle).trim() === '') && w.serviceId && w.serviceProvider,
    );

  let anyMissing = hasMissing(config?.workflows);
  if (!anyMissing && Array.isArray(config?.sources)) {
    anyMissing = config.sources.some((s: any) => hasMissing(s?.workflows));
  }
  if (!anyMissing && Array.isArray(config?.dataSources)) {
    anyMissing = config.dataSources.some((s: any) => hasMissing(s?.workflows));
  }
  if (!anyMissing) return { config, filled: 0 };

  let entries;
  try {
    entries = await loadCatalogue();
  } catch (e) {
    console.warn('[catalogue] Failed to load APEx catalogue for title back-fill:', e);
    return { config, filled: 0 };
  }

  const lookup = new Map<string, string>();
  for (const e of entries) {
    const id = e.record?.id || e.algorithmId;
    const title = e.record?.properties?.title?.trim() || e.name;
    if (id && title) lookup.set(`${e.provider}|${id}`, title);
  }

  let filled = 0;
  const fillWorkflows = (workflows: any[] | undefined): any[] | undefined => {
    if (!Array.isArray(workflows)) return workflows;
    return workflows.map((w) => {
      if (!w || (w.serviceTitle && String(w.serviceTitle).trim() !== '')) return w;
      if (!w.serviceId || !w.serviceProvider) return w;
      const title = lookup.get(`${w.serviceProvider}|${w.serviceId}`);
      if (!title) return w;
      filled++;
      return { ...w, serviceTitle: title };
    });
  };

  const next: any = { ...config };
  if (config?.workflows !== undefined) next.workflows = fillWorkflows(config.workflows);
  if (Array.isArray(config?.sources)) {
    next.sources = config.sources.map((s: any) =>
      s?.workflows ? { ...s, workflows: fillWorkflows(s.workflows) } : s,
    );
  }
  if (Array.isArray(config?.dataSources)) {
    next.dataSources = config.dataSources.map((s: any) =>
      s?.workflows ? { ...s, workflows: fillWorkflows(s.workflows) } : s,
    );
  }

  return { config: next, filled };
}

export type ImportProgress =
  | { stage: 'parse' | 'validate' | 'normalize' | 'done' }
  | {
      stage: 'capabilities';
      index: number;
      total: number;
      serviceName: string;
      status: 'pending' | 'ok' | 'error' | 'skipped';
    };

export interface ImportOptions {
  /** When true (default) skip GetCapabilities at load time — fetch lazily later. */
  deferCapabilities?: boolean;
  onProgress?: (e: ImportProgress) => void;
  /** Aborts the entire import (during the capabilities phase). */
  signal?: AbortSignal;
}

export interface ImportResult {
  success: boolean;
  errors?: ValidationErrorDetails[];
  jsonError?: any;
  /** Parsed JSON before validation — exposed so recovery flows can edit and retry. */
  rawData?: any;
  /** Original label / source so a retry can be issued without re-parsing. */
  sourceLabel?: string;
  loadedSource?: LoadedConfigSource;
  /** Number of services whose capabilities could not be fetched (errors / timeouts / skipped). */
  capabilitiesSkipped?: number;
  /** Total non-S3/non-STAC services that needed capabilities. */
  capabilitiesAttempted?: number;
}

const CONCURRENCY = 4;

/**
 * Run async tasks with bounded concurrency. Honors AbortSignal — when aborted,
 * no new tasks are started; in-flight tasks finish naturally (their own abort
 * signals are wired through `task` itself).
 */
async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency: number,
  signal?: AbortSignal,
): Promise<void> {
  let cursor = 0;
  const runners: Promise<void>[] = [];
  const next = async () => {
    while (cursor < items.length) {
      if (signal?.aborted) return;
      const i = cursor++;
      await worker(items[i], i);
    }
  };
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    runners.push(next());
  }
  await Promise.all(runners);
}

const isS3OrStacService = (service: Service): boolean => {
  const isS3 = service.sourceType === 's3' || parseS3Url(service.url) !== null;
  const isSkippedFormat = service.format === 's3' || service.format === 'stac';
  return isS3 || isSkippedFormat;
};

async function enrichServicesWithCapabilities(
  services: Service[],
  options: ImportOptions,
): Promise<{ services: Service[]; attempted: number; skipped: number }> {
  const { deferCapabilities = true, onProgress, signal } = options;

  // Quick load: don't fetch anything — capabilities will be resolved lazily on first use.
  if (deferCapabilities) {
    return { services, attempted: 0, skipped: 0 };
  }

  // Identify which services need capabilities.
  const targets: { service: Service; originalIndex: number }[] = [];
  services.forEach((service, originalIndex) => {
    if (!isS3OrStacService(service) && service.format) {
      targets.push({ service, originalIndex });
    }
  });

  const total = targets.length;
  const enriched: Service[] = [...services];
  let skipped = 0;

  await runWithConcurrency(
    targets,
    async ({ service, originalIndex }, idx) => {
      if (signal?.aborted) {
        skipped++;
        onProgress?.({
          stage: 'capabilities',
          index: idx,
          total,
          serviceName: service.name,
          status: 'skipped',
        });
        return;
      }
      onProgress?.({
        stage: 'capabilities',
        index: idx,
        total,
        serviceName: service.name,
        status: 'pending',
      });
      try {
        const capabilities = await fetchServiceCapabilities(
          service.url,
          service.format as DataSourceFormat,
        );
        if (capabilities) {
          enriched[originalIndex] = { ...service, capabilities };
          onProgress?.({
            stage: 'capabilities',
            index: idx,
            total,
            serviceName: service.name,
            status: 'ok',
          });
        } else {
          skipped++;
          onProgress?.({
            stage: 'capabilities',
            index: idx,
            total,
            serviceName: service.name,
            status: 'error',
          });
        }
      } catch {
        skipped++;
        onProgress?.({
          stage: 'capabilities',
          index: idx,
          total,
          serviceName: service.name,
          status: 'error',
        });
      }
    },
    CONCURRENCY,
    signal,
  );

  return { services: enriched, attempted: total, skipped };
}

export const useConfigImport = () => {
  const { dispatch } = useConfig();
  const { toast } = useToast();

  const runImportFromObject = useCallback(
    async (
      jsonData: any,
      sourceLabel: string,
      loadedSource: LoadedConfigSource,
      options: ImportOptions,
    ): Promise<ImportResult> => {
      const { onProgress } = options;
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const detectedTransforms = detectTransformations(jsonData);

        onProgress?.({ stage: 'normalize' });
        const normalizedData = normalizeImportedConfig(jsonData);

        onProgress?.({ stage: 'validate' });
        let validatedConfig;
        try {
          validatedConfig = ConfigurationSchema.parse(normalizedData);
        } catch (zodError: any) {
          console.error('[VALIDATION ERROR] Full Zod error:', JSON.stringify(zodError.errors, null, 2));
          throw zodError;
        }

        const { config: configWithTitles, filled: titlesFilled } =
          await enrichWorkflowsWithCatalogueTitles(validatedConfig);

        const { services: servicesWithCapabilities, attempted, skipped } =
          await enrichServicesWithCapabilities(configWithTitles.services || [], options);

        const configWithCapabilities = {
          ...configWithTitles,
          services: servicesWithCapabilities,
        };

        dispatch({
          type: 'LOAD_CONFIG',
          payload: { ...configWithCapabilities, __source: loadedSource } as any,
        });

        onProgress?.({ stage: 'done' });

        const transformationCount = Object.values(detectedTransforms).filter(Boolean).length;
        let description = `Successfully loaded configuration from ${sourceLabel}`;
        if (transformationCount > 0) {
          const transformationTypes: string[] = [];
          if (detectedTransforms.singleItemArrayToObject) transformationTypes.push('array/object');
          if (detectedTransforms.configureCogsAsImages) transformationTypes.push('COG images');
          if (detectedTransforms.transformSwipeLayersToData) transformationTypes.push('swipe layers');
          description += `. Export transformations (${transformationTypes.join(', ')}) were automatically reversed.`;
        }
        if (skipped > 0) {
          description += ` (${skipped} of ${attempted} service capabilities could not be fetched — they'll load on demand.)`;
        }
        if (titlesFilled > 0) {
          description += ` Populated ${titlesFilled} algorithm title${titlesFilled === 1 ? '' : 's'} from the APEx catalogue.`;
        }

        toast({ title: 'Configuration Loaded', description });

        return {
          success: true,
          rawData: jsonData,
          sourceLabel,
          loadedSource,
          capabilitiesAttempted: attempted,
          capabilitiesSkipped: skipped,
        };
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        if (error instanceof Error && error.name === 'ZodError') {
          const formattedErrors = formatValidationErrors(error as any, jsonData);
          return {
            success: false,
            errors: formattedErrors,
            rawData: jsonData,
            sourceLabel,
            loadedSource,
          };
        } else {
          console.error('Import error:', error);
          toast({
            title: 'Import Failed',
            description: error instanceof Error ? error.message : 'An unexpected error occurred while importing the configuration.',
            variant: 'destructive',
          });
          return { success: false, rawData: jsonData, sourceLabel, loadedSource };
        }
      }
    },
    [dispatch, toast],
  );

  const runImport = useCallback(
    async (
      jsonText: string,
      sourceLabel: string,
      loadedSource: LoadedConfigSource,
      options: ImportOptions,
    ): Promise<ImportResult> => {
      const { onProgress } = options;
      onProgress?.({ stage: 'parse' });
      const parseResult = parseJSONWithLineNumbers(jsonText);

      if (parseResult.error) {
        const errorMessage = parseResult.error.lineNumber
          ? `Invalid JSON at line ${parseResult.error.lineNumber}${parseResult.error.columnNumber ? `, column ${parseResult.error.columnNumber}` : ''}: ${parseResult.error.message}`
          : `Invalid JSON: ${parseResult.error.message}`;
        toast({ title: 'JSON Parse Error', description: errorMessage, variant: 'destructive' });
        return { success: false, jsonError: parseResult.error, sourceLabel, loadedSource };
      }

      return runImportFromObject(parseResult.data, sourceLabel, loadedSource, options);
    },
    [runImportFromObject, toast],
  );

  const importConfig = useCallback(
    async (file: File, options: ImportOptions = {}): Promise<ImportResult> => {
      const text = await file.text();
      return runImport(text, file.name, { type: 'upload', label: file.name }, options);
    },
    [runImport],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        importConfig(file);
      }
    },
    [importConfig],
  );

  const importConfigFromUrl = useCallback(
    async (
      url: string,
      source?: LoadedConfigSource,
      options: ImportOptions = {},
    ): Promise<ImportResult> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const text = await response.text();
        const effectiveSource: LoadedConfigSource = source ?? { type: 'url', label: url };
        return runImport(text, effectiveSource.label, effectiveSource, options);
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.error('Import error:', error);
        toast({
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred while loading the configuration.',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [runImport, dispatch, toast],
  );

  return { importConfig, handleFileSelect, importConfigFromUrl, runImportFromObject };
};
