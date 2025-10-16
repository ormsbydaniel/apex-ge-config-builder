import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewerLoader } from '@/hooks/useViewerLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { 
  getAvailableViewerVersions, 
  getLatestVersion, 
  getSavedViewerVersion,
  saveViewerVersion 
} from '@/utils/viewerVersions';
import type { ViewerVersion } from '@/types/viewer';

const VIEWER_CONTAINER_ID = 'apex-viewer-container';

const Preview = () => {
  const navigate = useNavigate();
  
  const [versions, setVersions] = useState<ViewerVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);

  // Load available versions
  useEffect(() => {
    const loadVersions = async () => {
      setIsLoadingVersions(true);
      const availableVersions = await getAvailableViewerVersions();
      setVersions(availableVersions);
      
      if (availableVersions.length > 0) {
        // Try to use saved version, or latest version
        const savedVersion = getSavedViewerVersion();
        const versionExists = availableVersions.some(v => v.version === savedVersion);
        
        if (savedVersion && versionExists) {
          setSelectedVersion(savedVersion);
        } else {
          const latest = getLatestVersion(availableVersions);
          if (latest) {
            setSelectedVersion(latest.version);
            saveViewerVersion(latest.version);
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

  const { isLoading, isReady, error, reload } = useViewerLoader({
    version: selectedVersion,
    containerId: VIEWER_CONTAINER_ID,
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
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Config Builder
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Viewer Version:</span>
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
          </div>

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

      <div className="flex-1 relative overflow-hidden">
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
          <div 
            id={VIEWER_CONTAINER_ID} 
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
};

export default Preview;
