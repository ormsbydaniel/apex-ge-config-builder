import { COLORMAP_DATA, ColorStop } from '@/constants/colormapData';

/**
 * Interpolates between two RGB colors
 */
export const interpolateColor = (
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number] => {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return [r, g, b];
};

// Note: rgbToHex has been consolidated to src/utils/colorUtils.ts
// Import from there if needed

/**
 * Generates an array of RGB colors for a colormap
 */
export const generateColorRamp = (
  colormapName: string,
  steps: number = 50,
  reverse: boolean = false
): [number, number, number][] => {
  const colorStops = COLORMAP_DATA[colormapName];
  if (!colorStops) {
    // Fallback to grayscale if colormap not found
    return Array.from({ length: steps }, (_, i) => {
      const gray = Math.round((i / (steps - 1)) * 255);
      return [gray, gray, gray];
    });
  }

  const colors: [number, number, number][] = [];
  
  for (let i = 0; i < steps; i++) {
    const position = i / (steps - 1);
    const actualPosition = reverse ? 1 - position : position;
    
    // Find the two color stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];
    
    for (let j = 0; j < colorStops.length - 1; j++) {
      if (actualPosition >= colorStops[j].index && actualPosition <= colorStops[j + 1].index) {
        lowerStop = colorStops[j];
        upperStop = colorStops[j + 1];
        break;
      }
    }
    
    if (lowerStop.index === upperStop.index) {
      colors.push([lowerStop.rgb[0], lowerStop.rgb[1], lowerStop.rgb[2]]);
    } else {
      const factor = (actualPosition - lowerStop.index) / (upperStop.index - lowerStop.index);
      const interpolatedColor = interpolateColor(
        [lowerStop.rgb[0], lowerStop.rgb[1], lowerStop.rgb[2]],
        [upperStop.rgb[0], upperStop.rgb[1], upperStop.rgb[2]],
        factor
      );
      colors.push(interpolatedColor);
    }
  }
  
  return colors;
};

/**
 * Creates a CSS linear-gradient string for a colormap
 */
export const createGradientCSS = (
  colormapName: string,
  reverse: boolean = false,
  steps: number = 20
): string => {
  const colors = generateColorRamp(colormapName, steps, reverse);
  const colorStops = colors.map((color, index) => {
    const percentage = (index / (colors.length - 1)) * 100;
    return `rgb(${color[0]}, ${color[1]}, ${color[2]}) ${percentage}%`;
  }).join(', ');
  
  return `linear-gradient(to right, ${colorStops})`;
};

/**
 * Gets available colormap names
 */
export const getAvailableColormaps = (): string[] => {
  return Object.keys(COLORMAP_DATA);
};

/**
 * Checks if a colormap exists
 */
export const isValidColormap = (colormapName: string): boolean => {
  return colormapName in COLORMAP_DATA;
};