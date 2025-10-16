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

    console.log('[useViewerLoader] Loading viewer version:', version);
    console.log('[useViewerLoader] Container ID:', containerId);
    
    const script = document.createElement('script');
    const scriptPath = `/viewer/${version}/bundle.js`;
    console.log('[useViewerLoader] Script path:', scriptPath);
    script.src = scriptPath;
    script.async = true;
    
    script.onload = () => {
      console.log('[useViewerLoader] Script loaded successfully');
      setIsLoading(false);
      
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('[useViewerLoader] Container not found:', containerId);
        setError('Viewer container not found');
        return;
      }
      console.log('[useViewerLoader] Container found:', container);

      try {
        // Check for viewer initialization function
        console.log('[useViewerLoader] window.initApexViewer:', window.initApexViewer);
        console.log('[useViewerLoader] window.ApexViewer:', window.ApexViewer);
        
        if (window.initApexViewer) {
          console.log('[useViewerLoader] Calling initApexViewer');
          (window.initApexViewer as (container: HTMLElement) => void)(container);
          setIsReady(true);
        } else if (window.ApexViewer?.init) {
          console.log('[useViewerLoader] Calling ApexViewer.init');
          (window.ApexViewer.init as (container: HTMLElement) => void)(container);
          viewerApiRef.current = window.ApexViewer;
          setIsReady(true);
        } else {
          console.error('[useViewerLoader] No initialization function found');
          setError('Viewer bundle loaded but no initialization function found');
        }
      } catch (err) {
        console.error('[useViewerLoader] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
      }
    };

    script.onerror = (event) => {
      setIsLoading(false);
      console.error('[useViewerLoader] Script load error:', event);
      console.error('[useViewerLoader] Failed to load:', scriptPath);
      if (event && typeof event !== 'string') {
        console.error('[useViewerLoader] Event target:', (event.target as HTMLScriptElement)?.src);
      }
      setError(`Failed to load viewer version ${version}. Make sure all build files are copied to /viewer/${version}/`);
    };

    console.log('[useViewerLoader] Appending script to document.head');
    scriptRef.current = script;
    document.head.appendChild(script);
    console.log('[useViewerLoader] Script appended, src:', script.src);
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
