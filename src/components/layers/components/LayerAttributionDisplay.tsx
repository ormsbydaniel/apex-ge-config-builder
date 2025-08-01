
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { DataSource } from '@/types/config';

interface LayerAttributionDisplayProps {
  source: DataSource;
}

const LayerAttributionDisplay = ({ source }: LayerAttributionDisplayProps) => {
  if (!source.meta?.attribution?.text) return null;

  return (
    <div className="space-y-2 -mt-1">
      <h4 className="text-sm font-medium text-gray-700">Attribution</h4>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          <span className="font-medium">Source:</span> {source.meta.attribution.text}
        </div>
        {source.meta.attribution.url && (
          <div>
            <span className="font-medium">URL:</span>
            <a 
              href={source.meta.attribution.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              {source.meta.attribution.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerAttributionDisplay;
