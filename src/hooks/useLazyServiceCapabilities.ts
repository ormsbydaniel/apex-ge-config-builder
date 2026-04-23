import { useCallback, useEffect, useRef, useState } from 'react';
import { Service, DataSourceFormat } from '@/types/config';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { useConfig } from '@/contexts/ConfigContext';
import { parseS3Url } from '@/utils/s3Utils';

interface LazyCapabilitiesResult {
  capabilities: Service['capabilities'] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * On-demand capability fetching for a service. If the service already has
 * `capabilities` in state, returns them immediately. Otherwise fetches
 * `GetCapabilities` once and caches into ConfigContext via UPDATE_SERVICE.
 *
 * Skips S3 / STAC services (those don't use GetCapabilities).
 */
export const useLazyServiceCapabilities = (
  service: Service | null | undefined,
  enabled: boolean = true,
): LazyCapabilitiesResult => {
  const { dispatch } = useConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<Set<string>>(new Set());

  const isSkipped = (svc: Service): boolean => {
    if (!svc.format) return true;
    if (svc.format === 's3' || svc.format === 'stac') return true;
    if (svc.sourceType === 's3' || svc.sourceType === 'stac') return true;
    if (parseS3Url(svc.url) !== null) return true;
    return false;
  };

  const doFetch = useCallback(async (svc: Service) => {
    if (!svc.format) return;
    setIsLoading(true);
    setError(null);
    try {
      const capabilities = await fetchServiceCapabilities(svc.url, svc.format as DataSourceFormat);
      if (capabilities) {
        dispatch({
          type: 'UPDATE_SERVICE',
          payload: { id: svc.id, patch: { capabilities } },
        });
      } else {
        setError('No capabilities returned');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load capabilities');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!enabled || !service) return;
    if (service.capabilities) return;
    if (isSkipped(service)) return;
    if (fetchedRef.current.has(service.id)) return;
    fetchedRef.current.add(service.id);
    doFetch(service);
  }, [enabled, service, doFetch]);

  const refetch = useCallback(() => {
    if (!service) return;
    fetchedRef.current.delete(service.id);
    doFetch(service);
  }, [service, doFetch]);

  return {
    capabilities: service?.capabilities,
    isLoading,
    error,
    refetch,
  };
};
