import { useCallback, useEffect, useRef, useState } from 'react';
import { Service, DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { fetchStacCapabilities } from '@/utils/stacCapabilities';
import { useConfig } from '@/contexts/ConfigContext';
import { parseS3Url, fetchS3BucketContents } from '@/utils/s3Utils';

const CONCURRENCY = 4;

export type ServiceValidationStatus = 'idle' | 'checking' | 'ok' | 'error';
export type ServiceKind = 'stac' | 'ogc' | 's3';

export interface GroupProgress {
  total: number;
  completed: number;
  inFlight: number;
}

interface BulkValidationResult {
  statuses: Record<string, ServiceValidationStatus>;
  progress: Record<ServiceKind, GroupProgress>;
  inFlightTotal: number;
  recheck: (serviceId?: string) => void;
}

const INITIAL_PROGRESS: Record<ServiceKind, GroupProgress> = {
  stac: { total: 0, completed: 0, inFlight: 0 },
  ogc: { total: 0, completed: 0, inFlight: 0 },
  s3: { total: 0, completed: 0, inFlight: 0 },
};

// Module-scoped marker of the last `lastLoaded` value we auto-validated for.
// Persists across ServicesManager mount/unmount (tab switches) so we only
// auto-validate once per loaded config.
let lastValidatedLoad: Date | null | 'manual' = null;

const classify = (svc: Service): ServiceKind | null => {
  if (!svc.url) return null;

  // STAC
  if (svc.format === 'stac' || svc.sourceType === 'stac') return 'stac';

  // S3
  if (svc.format === 's3' || svc.sourceType === 's3') return 's3';
  if (parseS3Url(svc.url) !== null) return 's3';

  // OGC services
  if (svc.format === 'wms' || svc.format === 'wmts' || svc.format === 'wfs') {
    return 'ogc';
  }

  return null;
};

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        await worker(items[idx]);
      } catch {
        // worker handles its own errors
      }
    }
  });
  await Promise.all(runners);
}

/**
 * Validates services in three parallel groups (STAC, OGC, S3).
 * Auto-runs once per `lastLoaded` change for services missing capabilities.
 */
export const useBulkServiceValidation = (
  services: Service[],
  enabled: boolean,
): BulkValidationResult => {
  const { config, dispatch } = useConfig();
  const lastLoaded = config.lastLoaded;
  const [statuses, setStatuses] = useState<Record<string, ServiceValidationStatus>>({});
  const [progress, setProgress] = useState<Record<ServiceKind, GroupProgress>>(INITIAL_PROGRESS);
  // Module-scoped (see bottom of file) so tab switches that unmount this hook
  // don't trigger re-validation for the same loaded config.
  const validatedForLoadRef = useRef<Date | null | 'manual'>(lastValidatedLoad);

  const updateProgress = useCallback(
    (kind: ServiceKind, delta: Partial<GroupProgress>) => {
      setProgress(prev => ({
        ...prev,
        [kind]: {
          total: prev[kind].total + (delta.total ?? 0),
          completed: prev[kind].completed + (delta.completed ?? 0),
          inFlight: prev[kind].inFlight + (delta.inFlight ?? 0),
        },
      }));
    },
    [],
  );

  const setStatus = useCallback((id: string, status: ServiceValidationStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  }, []);

  const validateStac = useCallback(async (svc: Service) => {
    setStatus(svc.id, 'checking');
    updateProgress('stac', { inFlight: 1 });
    try {
      const { capabilities } = await fetchStacCapabilities(svc.url);
      if (capabilities) {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities } } });
        setStatus(svc.id, 'ok');
      } else {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
        setStatus(svc.id, 'error');
      }
    } catch {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setStatus(svc.id, 'error');
    } finally {
      updateProgress('stac', { inFlight: -1, completed: 1 });
    }
  }, [dispatch, setStatus, updateProgress]);

  const validateOgc = useCallback(async (svc: Service) => {
    if (!svc.format) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setStatus(svc.id, 'error');
      return;
    }
    setStatus(svc.id, 'checking');
    updateProgress('ogc', { inFlight: 1 });
    try {
      const capabilities = await fetchServiceCapabilities(svc.url, svc.format as DataSourceFormat);
      if (capabilities) {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities } } });
        setStatus(svc.id, 'ok');
      } else {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
        setStatus(svc.id, 'error');
      }
    } catch {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setStatus(svc.id, 'error');
    } finally {
      updateProgress('ogc', { inFlight: -1, completed: 1 });
    }
  }, [dispatch, setStatus, updateProgress]);


  const validateS3 = useCallback(async (svc: Service) => {
    setStatus(svc.id, 'checking');
    updateProgress('s3', { inFlight: 1 });
    try {
      // Try a full bucket listing first (richer success); fall back to HEAD reachability.
      let listed = false;
      try {
        const objects = await fetchS3BucketContents(svc.url);
        const layers = objects.map(o => ({
          name: o.key,
          title: o.key.split('/').pop() || o.key,
          abstract: `S3 Object - Size: ${Math.round(o.size / 1024)}KB`,
        }));
        dispatch({
          type: 'UPDATE_SERVICE',
          payload: {
            id: svc.id,
            patch: {
              capabilities: {
                layers,
                title: 'S3 Bucket Contents',
                abstract: `Found ${objects.length} objects in bucket`,
              },
            },
          },
        });
        setStatus(svc.id, 'ok');
        listed = true;
      } catch {
        // Listing failed (CORS, denied, etc.) — fall through to HEAD check
      }

      if (!listed) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(svc.url, { method: 'HEAD', signal: controller.signal });
          // 200 = OK, 403 = bucket exists but list denied → still reachable
          if (res.ok || res.status === 403) {
            dispatch({
              type: 'UPDATE_SERVICE',
              payload: {
                id: svc.id,
                patch: {
                  capabilities: {
                    layers: [],
                    title: 'S3 bucket reachable',
                  },
                },
              },
            });
            setStatus(svc.id, 'ok');
          } else {
            dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
            setStatus(svc.id, 'error');
          }
        } finally {
          clearTimeout(timer);
        }
      }
    } catch {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setStatus(svc.id, 'error');
    } finally {
      updateProgress('s3', { inFlight: -1, completed: 1 });
    }
  }, [dispatch, setStatus, updateProgress]);

  const runBulk = useCallback(
    async (targets: Service[]) => {
      if (targets.length === 0) return;

      const stacTargets = targets.filter(s => classify(s) === 'stac');
      const ogcTargets = targets.filter(s => classify(s) === 'ogc');
      const s3Targets = targets.filter(s => classify(s) === 's3');

      // Reset per-group totals/completed for this run, preserve nothing else.
      setProgress({
        stac: { total: stacTargets.length, completed: 0, inFlight: 0 },
        ogc: { total: ogcTargets.length, completed: 0, inFlight: 0 },
        s3: { total: s3Targets.length, completed: 0, inFlight: 0 },
      });

      await Promise.all([
        runWithConcurrency(stacTargets, validateStac, CONCURRENCY),
        runWithConcurrency(ogcTargets, validateOgc, CONCURRENCY),
        runWithConcurrency(s3Targets, validateS3, CONCURRENCY),
      ]);
    },
    [validateStac, validateOgc, validateS3],
  );

  // Auto-trigger when tab becomes active for a freshly-loaded config
  useEffect(() => {
    if (!enabled) return;
    if (validatedForLoadRef.current === lastLoaded) return;
    validatedForLoadRef.current = lastLoaded;
    lastValidatedLoad = lastLoaded;

    const targets = services.filter(s => !s.capabilities && classify(s) !== null);
    if (targets.length === 0) return;
    runBulk(targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lastLoaded]);

  const recheck = useCallback(
    (serviceId?: string) => {
      if (serviceId) {
        const svc = services.find(s => s.id === serviceId);
        if (!svc) return;
        const kind = classify(svc);
        if (kind === 'stac') validateStac(svc);
        else if (kind === 'ogc') validateOgc(svc);
        else if (kind === 's3') validateS3(svc);
        return;
      }
      // Re-check all classifiable services
      const targets = services.filter(s => classify(s) !== null);
      validatedForLoadRef.current = 'manual';
      runBulk(targets);
    },
    [services, validateStac, validateOgc, validateS3, runBulk],
  );

  const inFlightTotal = progress.stac.inFlight + progress.ogc.inFlight + progress.s3.inFlight;

  return { statuses, progress, inFlightTotal, recheck };
};
