
import React from 'react';
import { ExternalLink, Image } from 'lucide-react';
import { DataSource } from '@/types/config';

interface LayerLegendDisplayProps {
  source: DataSource;
}

const LayerLegendDisplay = ({ source }: LayerLegendDisplayProps) => {
  if (!source.layout?.layerCard?.legend) return null;

  const legend = source.layout.layerCard.legend;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">
        Legend - {legend.type}
      </h4>
      
      {legend.type === 'image' && legend.url && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <a 
              href={legend.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 text-sm"
            >
              View Legend Image
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
      
      {legend.type === 'gradient' && source.meta && (
        <div className="space-y-2">
          <div 
            className="h-4 rounded border"
            style={{
              background: `linear-gradient(to right, ${source.meta.startColor}, ${source.meta.endColor})`
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{source.meta.min}</span>
            <span>{source.meta.max}</span>
          </div>
        </div>
      )}
      
      {legend.type === 'swatch' && (
        <div className="text-sm text-muted-foreground">
          See categories
        </div>
      )}
    </div>
  );
};

export default LayerLegendDisplay;
