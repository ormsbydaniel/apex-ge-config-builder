
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User } from 'lucide-react';
import { DataSource } from '@/types/config';

interface LayerAttributionDisplayProps {
  source: DataSource;
}

const LayerAttributionDisplay = ({ source }: LayerAttributionDisplayProps) => {
  if (!source.meta?.attribution?.text) return null;

  return (
    <div className="p-3 bg-muted/20 rounded-lg border">
      <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        Attribution
      </h4>
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium">Source:</span> {source.meta.attribution.text}
        </div>
        {source.meta.attribution.url && (
          <div className="text-sm">
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
