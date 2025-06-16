
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SwitchCamera } from 'lucide-react';
import { DataSource } from '@/types/config';

interface SwipeLayerConfigProps {
  source: DataSource;
}

const SwipeLayerConfig = ({ source }: SwipeLayerConfigProps) => {
  if (!source.meta?.swipeConfig) return null;

  return (
    <div className="p-4 bg-muted/30 rounded-lg">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <SwitchCamera className="h-4 w-4" />
        Swipe Configuration
      </h4>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium">Clipped Source:</span> {source.meta.swipeConfig.clippedSourceName}
        </div>
        <div>
          <span className="font-medium">Base Sources:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {(source.meta.swipeConfig.baseSourceNames || 
              [(source.meta.swipeConfig as any).baseSourceName]).map((sourceName: string) => (
              <Badge key={sourceName} variant="outline" className="text-xs">
                {sourceName}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeLayerConfig;
