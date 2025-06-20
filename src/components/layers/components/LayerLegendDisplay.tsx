
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Palette, Image, ExternalLink } from 'lucide-react';
import { DataSource } from '@/types/config';

interface LayerLegendDisplayProps {
  source: DataSource;
}

const LayerLegendDisplay = ({ source }: LayerLegendDisplayProps) => {
  if (!source.layout?.layerCard?.legend) return null;

  const legend = source.layout.layerCard.legend;

  return (
    <div className="p-4 bg-muted/30 rounded-lg">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Legend
      </h4>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium">Type:</span> {legend.type}
        </div>
        
        {legend.type === 'image' && legend.url && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <a 
                href={legend.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
              >
                View Legend Image
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-xs text-muted-foreground break-all">
              {legend.url}
            </div>
          </div>
        )}
        
        {legend.type === 'gradient' && source.meta && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Start:</span>
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: source.meta.startColor }}
                />
                <span className="text-xs">{source.meta.startColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">End:</span>
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: source.meta.endColor }}
                />
                <span className="text-xs">{source.meta.endColor}</span>
              </div>
            </div>
            
            {/* Gradient Preview */}
            <div className="space-y-2">
              <span className="font-medium">Preview:</span>
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
          </div>
        )}
        
        {legend.type === 'swatch' && source.meta?.categories && (
          <div>
            <span className="font-medium">Categories:</span>
            <div className="mt-2 flex flex-wrap gap-1">
              {source.meta.categories.map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerLegendDisplay;
