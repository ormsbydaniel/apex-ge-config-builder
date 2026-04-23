import { useCallback, useEffect, useRef, useState } from 'react';
import { Service, DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { useConfig } from '@/contexts/ConfigContext';
import { parseS3Url } from '@/utils/s3Utils';

const CONCURRENCY = 4;

export type ServiceValidationStatus = 'idle' | 'checking' | 'ok' | 'error';

interface BulkValidationResult {
  statuses: Record<string, ServiceValidationStatus>;
  inFlight: number;
  totalToCheck: number;
  completed: number;
  recheck: (serviceId?: string) => void;
}

const isSkipped = (svc: Service): boolean => {
  if (!svc.format) return true;
  if (svc.format === 's3' || svc.format === 'stac') return true;
  if (svc.sourceType === 's3' || svc.sourceType === 'stac') return true;
  if (parseS3Url(svc.url) !== null) return true;
  return false;
};

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        await worker(items[idx], idx);
      } catch {
        // worker handles its own errors
      }
    }
  });
  await Promise.all(runners);
}

/**
 * Validates services missing capabilities in bulk when `enabled` is true.
 * Runs once per `lastLoaded` change. Skips S3/STAC services.
 */
export const useBulkServiceValidation = (
  services: Service[],
  enabled: boolean,
): BulkValidationResult => {
  const { config, dispatch } = useConfig();
  const lastLoaded = config.lastLoaded;
  const [statuses, setStatuses] = useState<Record<string, ServiceValidationStatus>>({});
  const [inFlight, setInFlight] = useState(0);
  const [totalToCheck, setTotalToCheck] = useState(0);
  const [completed, setCompleted] = useState(0);
  const validatedForLoadRef = useRef<Date | null | 'manual'>(null);

  const validateOne = useCallback(async (svc: Service) => {
    if (!svc.format) return;
    setStatuses(prev => ({ ...prev, [svc.id]: 'checking' }));
    setInFlight(n => n + 1);
    try {
      const capabilities = await fetchServiceCapabilities(svc.url, svc.format as DataSourceFormat);
      if (capabilities) {
        dispatch({
          type: 'UPDATE_SERVICE',
          payload: { id: svc.id, patch: { capabilities } },
        });
        setStatuses(prev => ({ ...prev, [svc.id]: 'ok' }));
      } else {
        setStatuses(prev => ({ ...prev, [svc.id]: 'error' }));
      }
    } catch {
      setStatuses(prev => ({ ...prev, [svc.id]: 'error' }));
    } finally {
      setInFlight(n => n - 1);
      setCompleted(n => n + 1);
    }
  }, [dispatch]);

  const runBulk = useCallback(async (targets: Service[]) => {
    if (targets.length === 0) return;
    setTotalToCheck(targets.length);
    setCompleted(0);
    await runWithConcurrency(targets, validateOne, CONCURRENCY);
  }, [validateOne]);

  // Auto-trigger when tab becomes active for a freshly-loaded config
  useEffect(() => {
    if (!enabled) return;
    if (validatedForLoadRef.current === lastLoaded) return;
    validatedForLoadRef.current = lastLoaded;

    const targets = services.filter(s => !s.capabilities && !isSkipped(s));
    if (targets.length === 0) return;
    runBulk(targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lastLoaded]);

  const recheck = useCallback((serviceId?: string) => {
    if (serviceId) {
      const svc = services.find(s => s.id === serviceId);
      if (svc && !isSkipped(svc)) {
        validateOne(svc);
      }
      return;
    }
    // Re-check all non-S3/STAC services
    const targets = services.filter(s => !isSkipped(s));
    validatedForLoadRef.current = 'manual';
    runBulk(targets);
  }, [services, validateOne, runBulk]);

  return { statuses, inFlight, totalToCheck, completed, recheck };
};
