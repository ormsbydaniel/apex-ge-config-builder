import { useState, useEffect, useRef, useCallback } from 'react';
import { VIEWER_BUNDLE_BASE_URL } from '@/config/viewerBundleConfig';

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

  // Send config to iframe via postMessage
  const sendConfig = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && configRef.current) {
      console.log('[Config Builder] Sending config to viewer iframe');
      iframe.contentWindow.postMessage(
        { type: 'apex-viewer-config', config: configRef.current },
        '*'
      );
    }
  }, []);

  // Listen for ready message from viewer iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'apex-viewer-ready') {
        console.log('[Config Builder] Viewer iframe is ready');
        setIsLoading(false);
        setIsReady(true);
        isReadyRef.current = true;
        // Send initial config
        sendConfig();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendConfig]);

  // Re-send config when it changes
  useEffect(() => {
    if (isReady && config) {
      sendConfig();
    }
  }, [config, isReady, sendConfig]);

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

    const cacheBuster = Date.now();
    const baseUrlParam = encodeURIComponent(VIEWER_BUNDLE_BASE_URL);
    iframe.src = `/viewer/viewer-host.html?version=${version}&baseUrl=${baseUrlParam}&t=${cacheBuster}`;

    // Poll for legacy viewers that expose window.initApexViewer instead of postMessage
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
            sendConfig();
          }
        }
      } catch (e) {
        // Cross-origin access may fail, ignore
      }
    }, 500);

    // Set a timeout for loading
    const timeout = setTimeout(() => {
      clearInterval(legacyPoll);
      if (!isReadyRef.current) {
        setIsLoading(false);
        setError(`Viewer version ${version} timed out. Make sure bundle files exist at /viewer/${version}/`);
      }
    }, 30000);

    // Handle iframe load errors
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
  }, [version, sendConfig]);

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
