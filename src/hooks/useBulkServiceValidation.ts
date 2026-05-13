import { useCallback, useEffect, useRef, useState } from 'react';
import { Service, DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilitiesWithMetrics } from '@/utils/serviceCapabilities';
import { fetchStacCapabilitiesWithMetrics } from '@/utils/stacCapabilities';
import { useConfig } from '@/contexts/ConfigContext';
import { parseS3Url, fetchS3BucketContents } from '@/utils/s3Utils';
import {
  ProbeDiagnostic,
  classifyFetchError,
  classifyHttpResponse,
  classifyInvalidUrl,
  classifyMixedContent,
} from '@/utils/serviceDiagnostics';

/**
 * Run the same up-front URL + transport-security guards used by
 * `validateSingleService` (add-time probe) so retries surface the precise
 * "invalid URL" / "mixed content" diagnostics instead of a generic network
 * error from the eventual fetch failure.
 */
const preflightDiagnostic = (url: string | undefined): ProbeDiagnostic | null => {
  if (!url || !url.trim()) {
    return { category: 'invalid-url', title: 'URL is empty' };
  }
  return classifyInvalidUrl(url) ?? classifyMixedContent(url) ?? null;
};

const CONCURRENCY = 4;

// Tunable diagnostic thresholds — adjust here, no UI exposure yet.
const CAPABILITIES_SLOW_MS = 3000;
const CAPABILITIES_LARGE_BYTES = 2 * 1024 * 1024;

export type ServiceValidationStatus = 'idle' | 'checking' | 'ok' | 'warning' | 'error';
export type ServiceKind = 'stac' | 'ogc' | 's3';

export interface GroupProgress {
  total: number;
  completed: number;
  inFlight: number;
}

interface BulkValidationResult {
  statuses: Record<string, ServiceValidationStatus>;
  warnings: Record<string, string[]>;
  /** Per-service structured failure diagnostic, populated when status === 'error'. */
  errors: Record<string, ProbeDiagnostic>;
  progress: Record<ServiceKind, GroupProgress>;
  inFlightTotal: number;
  recheck: (id?: string) => void;
}

const INITIAL_PROGRESS: Record<ServiceKind, GroupProgress> = {
  stac: { total: 0, completed: 0, inFlight: 0 },
  ogc: { total: 0, completed: 0, inFlight: 0 },
  s3: { total: 0, completed: 0, inFlight: 0 },
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

// Module-scoped marker of the last `lastLoaded` value we auto-validated for.
// Persists across ServicesManager mount/unmount (tab switches) so we only
// auto-validate once per loaded config.
let lastValidatedLoad: Date | null | 'manual' = null;
// Module-scoped status / warning caches, keyed by `lastLoaded`. Survives tab
// switches so the failures panel and per-card badges stay populated without
// re-running probes.
let cachedStatuses: Record<string, ServiceValidationStatus> = {};
let cachedWarnings: Record<string, string[]> = {};
let cachedErrors: Record<string, ProbeDiagnostic> = {};

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
 *
 * GeoJSON / data-source size checks are NOT performed here — those belong to
 * the Layer QA "Run Data Source Validation" flow (see src/utils/layerValidation.ts).
 */
export const useBulkServiceValidation = (
  services: Service[],
  enabled: boolean,
): BulkValidationResult => {
  const { dispatch, config } = useConfig();
  const lastLoaded = config.lastLoaded;
  const [statuses, setStatuses] = useState<Record<string, ServiceValidationStatus>>(cachedStatuses);
  const [warnings, setWarnings] = useState<Record<string, string[]>>(cachedWarnings);
  const [errors, setErrors] = useState<Record<string, ProbeDiagnostic>>(cachedErrors);
  const [progress, setProgress] = useState<Record<ServiceKind, GroupProgress>>(INITIAL_PROGRESS);
  // Module-scoped (see top of file) so tab switches that unmount this hook
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
    setStatuses(prev => {
      const next = { ...prev, [id]: status };
      cachedStatuses = next;
      return next;
    });
  }, []);

  const setWarningMessages = useCallback((id: string, messages: string[]) => {
    setWarnings(prev => {
      const next = { ...prev };
      if (messages.length === 0) {
        delete next[id];
      } else {
        next[id] = messages;
      }
      cachedWarnings = next;
      return next;
    });
  }, []);

  const setError = useCallback((id: string, diagnostic: ProbeDiagnostic | undefined) => {
    setErrors(prev => {
      const next = { ...prev };
      if (!diagnostic) {
        delete next[id];
      } else {
        next[id] = diagnostic;
      }
      cachedErrors = next;
      return next;
    });
  }, []);

  const collectCapabilitiesWarnings = (durationMs?: number, bytes?: number): string[] => {
    const msgs: string[] = [];
    if (typeof durationMs === 'number' && durationMs > CAPABILITIES_SLOW_MS) {
      msgs.push(`Slow GetCapabilities response: ${(durationMs / 1000).toFixed(1)}s (threshold ${(CAPABILITIES_SLOW_MS / 1000).toFixed(1)}s)`);
    }
    if (typeof bytes === 'number' && bytes > CAPABILITIES_LARGE_BYTES) {
      msgs.push(`Large GetCapabilities response: ${formatBytes(bytes)} (threshold ${formatBytes(CAPABILITIES_LARGE_BYTES)})`);
    }
    return msgs;
  };

  const validateStac = useCallback(async (svc: Service) => {
    setStatus(svc.id, 'checking');
    setWarningMessages(svc.id, []);
    setError(svc.id, undefined);
    const pre = preflightDiagnostic(svc.url);
    if (pre) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setError(svc.id, pre);
      setStatus(svc.id, 'error');
      return;
    }
    updateProgress('stac', { inFlight: 1 });
    try {
      const { capabilities, durationMs, bytes, diagnostic } = await fetchStacCapabilitiesWithMetrics(svc.url);
      if (capabilities) {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities } } });
        const warns = collectCapabilitiesWarnings(durationMs, bytes);
        setWarningMessages(svc.id, warns);
        setStatus(svc.id, warns.length > 0 ? 'warning' : 'ok');
      } else {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
        setError(svc.id, diagnostic ?? { category: 'unknown', title: "Couldn't fetch STAC catalogue" });
        setStatus(svc.id, 'error');
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setError(svc.id, classifyFetchError(err, { url: svc.url }));
      setStatus(svc.id, 'error');
    } finally {
      updateProgress('stac', { inFlight: -1, completed: 1 });
    }
  }, [dispatch, setStatus, setWarningMessages, setError, updateProgress]);

  const validateOgc = useCallback(async (svc: Service) => {
    if (!svc.format) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setError(svc.id, { category: 'unknown', title: 'Missing service format' });
      setStatus(svc.id, 'error');
      return;
    }
    setStatus(svc.id, 'checking');
    setWarningMessages(svc.id, []);
    setError(svc.id, undefined);
    const pre = preflightDiagnostic(svc.url);
    if (pre) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setError(svc.id, pre);
      setStatus(svc.id, 'error');
      return;
    }
    updateProgress('ogc', { inFlight: 1 });
    try {
      const { capabilities, durationMs, bytes, diagnostic } = await fetchServiceCapabilitiesWithMetrics(svc.url, svc.format as DataSourceFormat);
      if (capabilities) {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities } } });
        const warns = collectCapabilitiesWarnings(durationMs, bytes);
        setWarningMessages(svc.id, warns);
        setStatus(svc.id, warns.length > 0 ? 'warning' : 'ok');
      } else {
        dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
        setError(svc.id, diagnostic ?? { category: 'unknown', title: "Couldn't fetch capabilities" });
        setStatus(svc.id, 'error');
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setError(svc.id, classifyFetchError(err, { url: svc.url }));
      setStatus(svc.id, 'error');
    } finally {
      updateProgress('ogc', { inFlight: -1, completed: 1 });
    }
  }, [dispatch, setStatus, setWarningMessages, setError, updateProgress]);


  const validateS3 = useCallback(async (svc: Service) => {
    setStatus(svc.id, 'checking');
    setWarningMessages(svc.id, []);
    setError(svc.id, undefined);
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
        const startedAt = performance.now();
        try {
          const res = await fetch(svc.url, { method: 'HEAD', signal: controller.signal });
          const durationMs = performance.now() - startedAt;
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
            const httpDiag = classifyHttpResponse(res, { durationMs });
            setError(svc.id, httpDiag ?? {
              category: 'http-other',
              title: `Endpoint returned HTTP ${res.status}`,
              httpStatus: res.status,
              durationMs,
            });
            setStatus(svc.id, 'error');
          }
        } catch (err) {
          dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
          setError(svc.id, classifyFetchError(err, { url: svc.url, durationMs: performance.now() - startedAt }));
          setStatus(svc.id, 'error');
        } finally {
          clearTimeout(timer);
        }
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { id: svc.id, patch: { capabilities: undefined } } });
      setError(svc.id, classifyFetchError(err, { url: svc.url }));
      setStatus(svc.id, 'error');
    } finally {
      updateProgress('s3', { inFlight: -1, completed: 1 });
    }
  }, [dispatch, setStatus, setWarningMessages, setError, updateProgress]);

  const runBulk = useCallback(
    async (svcTargets: Service[]) => {
      if (svcTargets.length === 0) return;

      const stacTargets = svcTargets.filter(s => classify(s) === 'stac');
      const ogcTargets = svcTargets.filter(s => classify(s) === 'ogc');
      const s3Targets = svcTargets.filter(s => classify(s) === 's3');

      // Reset per-group totals/completed for this run.
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
    // New config (or first load): clear stale status cache so badges from a
    // previous config don't bleed into this one.
    cachedStatuses = {};
    cachedWarnings = {};
    cachedErrors = {};
    setStatuses({});
    setWarnings({});
    setErrors({});
    validatedForLoadRef.current = lastLoaded;
    lastValidatedLoad = lastLoaded;

    const targets = services.filter(s => !s.capabilities && classify(s) !== null);
    if (targets.length === 0) return;
    runBulk(targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lastLoaded]);

  const recheck = useCallback(
    (id?: string) => {
      if (id) {
        const svc = services.find(s => s.id === id);
        if (svc) {
          const kind = classify(svc);
          if (kind === 'stac') validateStac(svc);
          else if (kind === 'ogc') validateOgc(svc);
          else if (kind === 's3') validateS3(svc);
        }
        return;
      }
      // Re-check all classifiable services.
      const targets = services.filter(s => classify(s) !== null);
      validatedForLoadRef.current = 'manual';
      lastValidatedLoad = 'manual';
      runBulk(targets);
    },
    [services, validateStac, validateOgc, validateS3, runBulk],
  );

  const inFlightTotal =
    progress.stac.inFlight + progress.ogc.inFlight + progress.s3.inFlight;

  return { statuses, warnings, errors, progress, inFlightTotal, recheck };
};
