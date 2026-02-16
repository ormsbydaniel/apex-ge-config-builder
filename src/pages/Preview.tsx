import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewerLoader } from '@/hooks/useViewerLoader';
import { useConfig } from '@/contexts/ConfigContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
    };
    console.log('[Config Builder Preview] viewerConfig.layout:', vConfig.layout);
    console.log('[Config Builder Preview] viewerConfig.layout.theme:', vConfig.layout?.theme);
    return vConfig;
  }, [config.version, config.layout, config.interfaceGroups, config.exclusivitySets, config.services, config.sources, config.mapConstraints]);
  
  const [versions, setVersions] = useState<ViewerVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');

  // Load available versions and check for updates
  useEffect(() => {
    const loadVersions = async () => {
      setIsLoadingVersions(true);
      const availableVersions = await getAvailableViewerVersions();
      const manifestLatest = await getLatestVersionFromManifest();
      
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
  }, []);

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

  const { isLoading, isReady, error, reload, iframeRef } = useViewerLoader({
    version: selectedVersion,
    config: viewerConfig,
    enabled: selectedVersion !== '',
  });

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
                      Please add viewer bundles to the <code className="bg-muted px-1 rounded">public/viewer/</code> directory 
                      using semantic versioning (e.g., <code className="bg-muted px-1 rounded">public/viewer/3.2.2/bundle.js</code>).
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
      <header className="absolute top-[3px] left-1/2 -translate-x-1/2 z-50 border rounded-lg bg-card/95 backdrop-blur-sm shadow-lg px-3 py-1">
        <div className="flex items-center gap-2">
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
                          public/viewer/{selectedVersion}/bundle.js
                        </code>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Apex Viewer"
          />
        )}
      </div>
    </div>
    </>
  );
};

export default Preview;
