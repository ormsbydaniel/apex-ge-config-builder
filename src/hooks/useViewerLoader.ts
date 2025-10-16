import { useState, useEffect, useRef, useCallback } from 'react';
import { ViewerAPI } from '@/types/viewer';

interface UseViewerLoaderProps {
  version: string;
  containerId: string;
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

    const script = document.createElement('script');
    script.src = `/viewer/${version}/bundle.js`;
    script.type = 'module'; // Load as ES module
    script.async = true;
    
    script.onload = () => {
      // Give the script time to execute and assign window.initApexViewer
      setTimeout(() => {
        setIsLoading(false);
        
        const container = document.getElementById(containerId);
        if (!container) {
          setError('Viewer container not found');
          return;
        }

        try {
          // Check for viewer initialization function
          if (window.initApexViewer) {
            console.log('[Config Builder] Found window.initApexViewer, initializing...');
            (window.initApexViewer as (container: HTMLElement) => void)(container);
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
      }, 100);
    };

    script.onerror = (event) => {
      setIsLoading(false);
      console.error('Script load error:', event);
      setError(`Failed to load viewer version ${version}. Make sure all build files are copied to /viewer/${version}/`);
    };

    scriptRef.current = script;
    document.head.appendChild(script);
  }, [version, containerId, cleanup]);

  useEffect(() => {
    if (enabled && version) {
      loadViewer();
    }
    return cleanup;
  }, [enabled, version, loadViewer, cleanup]);

  return {
    isLoading,
    isReady,
    error,
    reload: loadViewer,
  };
}
