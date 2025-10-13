import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DetectionResult, DetectedServiceType } from '@/utils/serviceFileParser';

interface ServiceUploadConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectionResult: DetectionResult | null;
  onConfirm: (serviceName: string, serviceType: DetectedServiceType) => void;
  onCancel: () => void;
}

export function ServiceUploadConfirmDialog({
  open,
  onOpenChange,
  detectionResult,
  onConfirm,
  onCancel,
}: ServiceUploadConfirmDialogProps) {
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState<DetectedServiceType>('unknown');

  useEffect(() => {
    if (detectionResult) {
      setServiceName(detectionResult.serviceName);
      setServiceType(detectionResult.serviceType);
    }
  }, [detectionResult]);

  if (!detectionResult) return null;

  const handleConfirm = () => {
    onConfirm(serviceName, serviceType);
  };

  const getConfidenceBadge = () => {
    const variants = {
      high: { icon: CheckCircle2, className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      medium: { icon: AlertTriangle, className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
      low: { icon: AlertCircle, className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    };
    
    const config = variants[detectionResult.confidence];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {detectionResult.confidence} confidence
      </Badge>
    );
  };

  const layerCount = detectionResult.capabilities?.layers.length || 0;
  const previewLayers = detectionResult.capabilities?.layers.slice(0, 10) || [];
  const hasMore = layerCount > 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Confirm Service Detection</DialogTitle>
        <DialogDescription>
          Review the detected service details before adding it to your configuration.
          {detectionResult?.rawData?.__fileType && (
            <span className="block mt-1 text-xs">
              Source: {detectionResult.rawData.__fileType} file
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

        <div className="space-y-4">
          {/* Detection Summary */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Detected Type:</span>
            <Badge variant="secondary" className="uppercase">
              {detectionResult.serviceType}
            </Badge>
            {getConfidenceBadge()}
          </div>

          {/* Warnings */}
          {detectionResult.warnings && detectionResult.warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {detectionResult.warnings.map((warning, idx) => (
                  <div key={idx}>{warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Service Name Input */}
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Enter service name"
            />
          </div>

          {/* Service Type Override */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Select value={serviceType} onValueChange={(value) => setServiceType(value as DetectedServiceType)}>
              <SelectTrigger id="serviceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s3">S3 Bucket</SelectItem>
                <SelectItem value="stac">STAC Catalog</SelectItem>
                <SelectItem value="wms">WMS Service</SelectItem>
                <SelectItem value="wmts">WMTS Service</SelectItem>
                <SelectItem value="unknown">Unknown / Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview Section */}
          {detectionResult.capabilities && (
            <div className="space-y-2">
              <Label>
                Detected Items ({layerCount} {layerCount === 1 ? 'item' : 'items'})
              </Label>
              <ScrollArea className="h-48 rounded-md border p-4">
                <div className="space-y-3">
                  {previewLayers.map((layer, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{layer.title || layer.name}</div>
                      {layer.name !== layer.title && (
                        <div className="text-muted-foreground text-xs">ID: {layer.name}</div>
                      )}
                      {layer.abstract && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {layer.abstract.length > 100 
                            ? `${layer.abstract.substring(0, 100)}...` 
                            : layer.abstract}
                        </div>
                      )}
                    </div>
                  ))}
                  {hasMore && (
                    <div className="text-sm text-muted-foreground italic">
                      and {layerCount - 10} more...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!serviceName.trim() || serviceType === 'unknown'}
          >
            Confirm & Add Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
