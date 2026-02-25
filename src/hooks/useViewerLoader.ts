import { useState, useEffect, useRef, useCallback } from 'react';
import { VIEWER_BUNDLE_BASE_URL } from '@/config/viewerBundleConfig';
import { compareVersions } from '@/utils/viewerVersions';

interface UseViewerLoaderProps {
  version: string;
  config?: any;
  enabled?: boolean;
}

interface UseViewerLoaderReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  reload: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * Determine if a version uses the new window.explorerConfig pattern (3.6.0+)
 * vs the legacy initApexViewer/postMessage approach.
 */
function isModernViewer(version: string): boolean {
  // Dev/candidate builds for 3.6+ are modern
  if (version.startsWith('dev-3-6') || version.startsWith('dev-3.6')) return true;
  // Strip pre-release suffix (e.g., "3.6.0-rc" -> "3.6.0", "3.6.0-beta.1" -> "3.6.0")
  const baseVersion = version.replace(/-.*$/, '');
  // Must be a valid semver base (x.y.z)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(baseVersion)) return false;
  // compareVersions returns negative if a > b
  return compareVersions(baseVersion, '3.6.0') <= 0;
}

export function useViewerLoader({
  version,
  config,
  enabled = true,
}: UseViewerLoaderProps): UseViewerLoaderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const configRef = useRef<any>(config);
  const isReadyRef = useRef(false);
  configRef.current = config;

  // For modern viewers: set window.explorerConfig on iframe
  const setExplorerConfig = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !configRef.current) return;
    try {
      (iframe.contentWindow as any).explorerConfig = configRef.current;
    } catch (e) {
      // Cross-origin access may fail
    }
  }, []);

  // For legacy viewers: send config via postMessage
  const sendConfigLegacy = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && configRef.current) {
      console.log('[Config Builder] Sending config to viewer iframe (legacy)');
      iframe.contentWindow.postMessage(
        { type: 'apex-viewer-config', config: configRef.current },
        '*'
      );
    }
  }, []);

  // Invalidate React Query cache in modern viewer for live updates
  const invalidateViewerConfig = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      const iframeWindow = iframe.contentWindow as any;
      // Update the global config
      iframeWindow.explorerConfig = configRef.current;
      // Invalidate the React Query cache so the viewer re-reads it
      if (iframeWindow.__queryClient) {
        iframeWindow.__queryClient.invalidateQueries({ queryKey: ['config'] });
      }
    } catch (e) {
      // Cross-origin access may fail
    }
  }, []);

  // Listen for messages from viewer iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Modern viewer host requests config before loading bundle
      if (event.data?.type === 'apex-viewer-request-config') {
        console.log('[Config Builder] Viewer host requested config, delivering...');
        const iframe = iframeRef.current;
        if (iframe?.contentWindow && configRef.current) {
          iframe.contentWindow.postMessage(
            { type: 'apex-viewer-config-delivery', config: configRef.current },
            '*'
          );
        }
      }

      // Viewer is ready (rendered content)
      if (event.data?.type === 'apex-viewer-ready') {
        console.log('[Config Builder] Viewer iframe is ready');
        setIsLoading(false);
        setIsReady(true);
        isReadyRef.current = true;
        if (isModernViewer(version)) {
          setExplorerConfig();
        } else {
          sendConfigLegacy();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [version, setExplorerConfig, sendConfigLegacy]);

  // Re-send config when it changes
  useEffect(() => {
    if (isReady && config) {
      if (isModernViewer(version)) {
        invalidateViewerConfig();
      } else {
        sendConfigLegacy();
      }
    }
  }, [config, isReady, version, invalidateViewerConfig, sendConfigLegacy]);

  // Load viewer by setting iframe src
  const loadViewer = useCallback(() => {
    setIsLoading(true);
    setIsReady(false);
    isReadyRef.current = false;
    setError(null);

    const iframe = iframeRef.current;
    if (!iframe) {
      setError('Viewer iframe not found');
      setIsLoading(false);
      return;
    }

    // Config is now delivered via postMessage before bundle loads,
    // so no need to set explorerConfig on iframe load event.

    const cacheBuster = Date.now();
    const baseUrlParam = encodeURIComponent(VIEWER_BUNDLE_BASE_URL);
    iframe.src = `/viewer/viewer-host.html?version=${version}&baseUrl=${baseUrlParam}&t=${cacheBuster}`;

    // Poll for legacy viewers that expose window.initApexViewer
    const legacyPoll = setInterval(() => {
      try {
        const iframeWindow = iframe.contentWindow as any;
        if (iframeWindow?.initApexViewer && !isReadyRef.current) {
          clearInterval(legacyPoll);
          console.log('[Config Builder] Legacy viewer detected, calling initApexViewer');
          const root = iframeWindow.document.getElementById('root');
          if (root) {
            iframeWindow.initApexViewer(root);
            setIsLoading(false);
            setIsReady(true);
            isReadyRef.current = true;
            sendConfigLegacy();
          }
        }
      } catch (e) {
        // Cross-origin access may fail, ignore
      }
    }, 500);

    // Timeout
    const timeout = setTimeout(() => {
      clearInterval(legacyPoll);
      if (!isReadyRef.current) {
        setIsLoading(false);
        setError(`Viewer version ${version} timed out. Check that bundle files exist in S3 at ${VIEWER_BUNDLE_BASE_URL}${version}/`);
      }
    }, 30000);

    iframe.onerror = () => {
      clearTimeout(timeout);
      clearInterval(legacyPoll);
      setIsLoading(false);
      setError(`Failed to load viewer version ${version}`);
    };

    return () => {
      clearTimeout(timeout);
      clearInterval(legacyPoll);
    };
  }, [version, setExplorerConfig, sendConfigLegacy]);

  // Trigger load when version changes or enabled
  useEffect(() => {
    if (enabled && version) {
      const cleanupTimeout = loadViewer();
      return cleanupTimeout;
    }
  }, [enabled, version, loadViewer]);

  return {
    isLoading,
    isReady,
    error,
    reload: loadViewer,
    iframeRef,
  };
}
