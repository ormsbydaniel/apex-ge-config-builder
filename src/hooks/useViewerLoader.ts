import { useState, useEffect, useRef, useCallback } from 'react';
import { ViewerAPI } from '@/types/viewer';

interface UseViewerLoaderProps {
  version: string;
  containerId: string;
  config?: any;
  enabled?: boolean;
}

interface UseViewerLoaderReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  reload: () => void;
}

export function useViewerLoader({
  version,
  containerId,
  config,
  enabled = true,
}: UseViewerLoaderProps): UseViewerLoaderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const viewerApiRef = useRef<ViewerAPI | null>(null);

  const cleanup = useCallback(() => {
    // Cleanup previous viewer instance
    if (viewerApiRef.current?.destroy) {
      viewerApiRef.current.destroy();
    }
    
    // Remove script tag
    if (scriptRef.current) {
      document.head.removeChild(scriptRef.current);
      scriptRef.current = null;
    }
    
    // Clear global viewer reference
    if (window.ApexViewer) {
      delete window.ApexViewer;
    }
    if (window.initApexViewer) {
      delete window.initApexViewer;
    }
    
    setIsReady(false);
  }, []);

  const loadViewer = useCallback(() => {
    cleanup();
    setIsLoading(true);
    setError(null);

    // Check if initApexViewer is already available (script already loaded)
    if (window.initApexViewer) {
      console.log('[Config Builder] Viewer already loaded, initializing directly');
      const container = document.getElementById(containerId);
      if (!container) {
        setIsLoading(false);
        setError('Viewer container not found');
        return;
      }

      try {
        (window.initApexViewer as (container: HTMLElement, options?: { config?: any }) => void)(container, { config });
        setIsLoading(false);
        setIsReady(true);
        return;
      } catch (err) {
        console.error('Viewer initialization error:', err);
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
        return;
      }
    }

    // Load the script with cache busting to ensure fresh load
    const script = document.createElement('script');
    const cacheBuster = Date.now();
    script.src = `/viewer/${version}/bundle.js?v=${cacheBuster}`;
    script.type = 'module';
    script.async = true;
    
    script.onload = () => {
      // Give the module time to execute and assign window.initApexViewer
      setTimeout(() => {
        setIsLoading(false);
        
        const container = document.getElementById(containerId);
        if (!container) {
          setError('Viewer container not found');
          return;
        }

        try {
          if (window.initApexViewer) {
            console.log('[Config Builder] Initializing viewer with config:', config);
            (window.initApexViewer as (container: HTMLElement, options?: { config?: any }) => void)(container, { config });
            setIsReady(true);
          } else if (window.ApexViewer?.init) {
            console.log('[Config Builder] Found window.ApexViewer.init, initializing...');
            (window.ApexViewer.init as (container: HTMLElement) => void)(container);
            viewerApiRef.current = window.ApexViewer;
            setIsReady(true);
          } else {
            console.error('[Config Builder] No initialization function found. window.initApexViewer:', window.initApexViewer, 'window.ApexViewer:', window.ApexViewer);
            setError('Viewer bundle loaded but no initialization function found');
          }
        } catch (err) {
          console.error('Viewer initialization error:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
        }
      }, 500);
    };

    script.onerror = (event) => {
      setIsLoading(false);
      console.error('Script load error:', event);
      setError(`Failed to load viewer version ${version}. Make sure all build files are copied to /viewer/${version}/`);
    };

    scriptRef.current = script;
    document.head.appendChild(script);
  }, [version, containerId, config, cleanup]);

  useEffect(() => {
    if (enabled && version && config) {
      loadViewer();
    }
    return cleanup;
  }, [enabled, version, config, loadViewer, cleanup]);

  return {
    isLoading,
    isReady,
    error,
    reload: loadViewer,
  };
}
