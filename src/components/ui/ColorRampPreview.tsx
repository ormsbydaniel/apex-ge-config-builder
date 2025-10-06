import React from 'react';
import { createGradientCSS, isValidColormap } from '@/utils/colormapUtils';

interface ColorRampPreviewProps {
  colormap: string;
  width?: number;
  height?: number;
  reverse?: boolean;
  className?: string;
}

const ColorRampPreview = ({ 
  colormap, 
  width = 60, 
  height = 16, 
  reverse = false,
  className = '' 
}: ColorRampPreviewProps) => {
  if (!isValidColormap(colormap)) {
    return (
      <div 
        className={`bg-muted border rounded ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        title={`Unknown colormap: ${colormap}`}
      />
    );
  }

  const gradientStyle = {
    background: createGradientCSS(colormap, reverse),
    width: `${width}px`,
    height: `${height}px`,
  };

  return (
    <div 
      className={`border rounded shadow-sm ${className}`}
      style={gradientStyle}
      title={`${colormap}${reverse ? ' (reversed)' : ''}`}
      aria-label={`Color ramp preview for ${colormap}${reverse ? ' reversed' : ''}`}
    />
  );
};

export default ColorRampPreview;