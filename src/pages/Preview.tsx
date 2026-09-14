import { useEffect, useState, useMemo, useRef } from 'react';
import { VIEWER_BUNDLE_BASE_URL } from '@/config/viewerBundleConfig';
import { useNavigate } from 'react-router-dom';
import { useViewerLoader } from '@/hooks/useViewerLoader';
import { useConfig } from '@/contexts/ConfigContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, FileJson, Copy, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

import { 
  getAvailableViewerVersions, 
  getLatestVersion, 
  getLatestVersionFromManifest,
  getSavedViewerVersion,
  saveViewerVersion,
  hasShownVersionAlertThisSession,
  markVersionAlertAsShown
} from '@/utils/viewerVersions';
import type { ViewerVersion } from '@/types/viewer';
import { useAppSettings } from '@/hooks/useAppSettings';

const SEMVER_RE = /^\d+\.\d+\.\d+$/;



const Preview = () => {
  const navigate = useNavigate();
  const { config } = useConfig();
  
  // Extract only viewer-needed config fields, memoized to prevent unnecessary reloads
  const viewerConfig = useMemo(() => {
    const vConfig = {
      version: config.version,
      layout: config.layout,
      interfaceGroups: config.interfaceGroups,
      exclusivitySets: config.exclusivitySets,
      services: config.services,
      sources: config.sources,
      mapConstraints: config.mapConstraints,
      projections: config.projections,
      stories: config.stories,
      settings: config.settings,
    };
    console.log('[Config Builder Preview] viewerConfig.layout:', vConfig.layout);
    console.log('[Config Builder Preview] viewerConfig.layout.theme:', vConfig.layout?.theme);
    return vConfig;
  }, [config.version, config.layout, config.interfaceGroups, config.exclusivitySets, config.services, config.sources, config.mapConstraints, config.projections, config.stories, config.settings]);
  
  const [versions, setVersions] = useState<ViewerVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const { settings } = useAppSettings();
  const showDev = settings.showDevViewerVersions;

  // Load available versions and check for updates
  useEffect(() => {
    const loadVersions = async () => {
      setIsLoadingVersions(true);
      const fetched = await getAvailableViewerVersions();
      const availableVersions = showDev ? fetched : fetched.filter(v => SEMVER_RE.test(v.version));
      const manifestLatestRaw = await getLatestVersionFromManifest();
      const manifestLatest = manifestLatestRaw && (showDev || SEMVER_RE.test(manifestLatestRaw))
        ? manifestLatestRaw
        : null;
      
      setVersions(availableVersions);
      if (manifestLatest) {
        setLatestVersion(manifestLatest);
      }
      
      if (availableVersions.length > 0) {
        const savedVersion = getSavedViewerVersion();
        const versionExists = availableVersions.some(v => v.version === savedVersion);
        
        if (savedVersion && versionExists) {
          setSelectedVersion(savedVersion);
          
          // Check if user is on older version and hasn't been alerted this session
          if (manifestLatest && savedVersion !== manifestLatest && !hasShownVersionAlertThisSession()) {
            setShowUpdateDialog(true);
          }
        } else {
          // No saved version or invalid - use latest
          const latest = manifestLatest || getLatestVersion(availableVersions)?.version;
          if (latest) {
            setSelectedVersion(latest);
            saveViewerVersion(latest);
          }
        }
      }
      
      setIsLoadingVersions(false);
    };
    
    loadVersions();
  }, [showDev]);

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    saveViewerVersion(version);
  };

  const handleUpdateToLatest = () => {
    if (latestVersion) {
      setSelectedVersion(latestVersion);
      saveViewerVersion(latestVersion);
    }
    markVersionAlertAsShown();
    setShowUpdateDialog(false);
  };

  const handleStayOnCurrent = () => {
    markVersionAlertAsShown();
    setShowUpdateDialog(false);
  };

  const { isLoading, isReady, error, reload, iframeRef, deliveredConfig } = useViewerLoader({
    version: selectedVersion,
    config: viewerConfig,
    enabled: selectedVersion !== '',
  });

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const deliveredConfigJson = useMemo(
    () => JSON.stringify(deliveredConfig, null, 2),
    [deliveredConfig]
  );

  const handleInspectConfig = () => {
    console.log('[Config Builder] Delivered config:', deliveredConfig);
    setShowConfigDialog(true);
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(deliveredConfigJson);
      toast.success('Config JSON copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };


  // ---- Draggable floating toolbar ----
  const toolbarRef = useRef<HTMLElement | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clampPos = (x: number, y: number) => {
    const el = toolbarRef.current;
    const margin = 4;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const maxX = Math.max(margin, window.innerWidth - w - margin);
    const maxY = Math.max(margin, window.innerHeight - h - margin);
    return {
      x: Math.min(Math.max(x, margin), maxX),
      y: Math.min(Math.max(y, margin), maxY),
    };
  };

  // Restore saved position, or fall back to the original default placement
  useEffect(() => {
    if (isLoadingVersions || versions.length === 0) return;
    const el = toolbarRef.current;
    if (!el) return;

    let restored: { x: number; y: number } | null = null;
    try {
      const raw = localStorage.getItem('preview-toolbar-position');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          restored = parsed;
        }
      }
    } catch {
      restored = null;
    }

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const fallback = {
      x: window.innerWidth / 2 - w / 2 + w * 0.05,
      y: 3 + h * 1.5,
    };
    const initial = restored ?? fallback;
    setToolbarPos(clampPos(initial.x, initial.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingVersions, versions.length]);

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = toolbarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setToolbarPos(clampPos(rect.left, rect.top));
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setToolbarPos(clampPos(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer already released
    }
    if (toolbarPos) {
      try {
        localStorage.setItem('preview-toolbar-position', JSON.stringify(toolbarPos));
      } catch {
        // storage unavailable
      }
    }
  };

  // Keep the toolbar on-screen when the window is resized
  useEffect(() => {
    const onResize = () => {
      setToolbarPos((prev) => (prev ? clampPos(prev.x, prev.y) : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingVersions) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading viewer versions...</p>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Config Builder
            </Button>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-2xl">
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">No viewer versions found</p>
                    <p className="text-sm">
                      No viewer bundles were found in the S3 bucket. Viewer bundles should be uploaded to{' '}
                      <code className="bg-muted px-1 rounded">https://esa-apex.s3.eu-west-1.amazonaws.com/software/</code>{' '}
                      using semantic versioning (e.g., <code className="bg-muted px-1 rounded">software/3.6.0/bundle.js</code>).
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Viewer Version Available</AlertDialogTitle>
            <AlertDialogDescription>
              You were last using version <span className="font-semibold">{selectedVersion}</span>, but version <span className="font-semibold">{latestVersion}</span> is now available. Would you like to update to the latest version?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStayOnCurrent}>
              Stay on {selectedVersion}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateToLatest}>
              Update to {latestVersion}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-screen relative bg-background">
      <header
        ref={toolbarRef}
        className="absolute z-50 border rounded-lg bg-card/95 backdrop-blur-sm shadow-lg px-3 py-1"
        style={
          toolbarPos
            ? { left: toolbarPos.x, top: toolbarPos.y }
            : { left: '50%', top: 3, transform: 'translateX(calc(-50% + 5%)) translateY(150%)' }
        }
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center -ml-1 mr-1 text-muted-foreground touch-none select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="Drag to reposition toolbar"
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Config Builder
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Geospatial Explorer Version:</span>
            <Select value={selectedVersion} onValueChange={handleVersionChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.version} value={v.version}>
                    {v.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            onClick={handleInspectConfig}
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Inspect delivered config"
          >
            <FileJson className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />



          <div className="flex items-center gap-3">
            {isLoading && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </Badge>
            )}
            {isReady && (
              <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                Ready
              </Badge>
            )}
            {error && (
              <Button onClick={reload} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="w-full h-full relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Failed to load viewer</p>
                      <p className="text-sm">{error}</p>
                      <p className="text-sm text-muted-foreground">
                        Make sure the bundle exists at <code className="bg-muted px-1 rounded">
                          {VIEWER_BUNDLE_BASE_URL}{selectedVersion}/bundle.js
                        </code>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        ) : null}
          <iframe
            ref={iframeRef}
            className={`w-full h-full border-0 ${error ? 'hidden' : ''}`}
            title="Apex Viewer"
          />
      </div>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4 pr-6">
              <span>Config delivered to viewer</span>
              <Button onClick={handleCopyConfig} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
            </DialogTitle>
          </DialogHeader>
          <pre className="flex-1 overflow-auto rounded-md bg-muted p-4 text-xs font-mono">
            {deliveredConfigJson}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
    </>

  );
};

export default Preview;
