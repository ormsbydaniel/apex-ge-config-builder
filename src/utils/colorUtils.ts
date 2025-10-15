
/**
 * Color utility functions for consistent color handling across the application
 * Phase 1 Refactoring: Enhanced color utilities with better error handling
 */

// Named colors mapping for consistent color handling
const NAMED_COLORS: Record<string, string> = {
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'green': '#008000',
  'blue': '#0000FF',
  'yellow': '#FFFF00',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'silver': '#C0C0C0',
  'gray': '#808080',
  'maroon': '#800000',
  'olive': '#808000',
  'lime': '#00FF00',
  'aqua': '#00FFFF',
  'teal': '#008080',
  'navy': '#000080',
  'fuchsia': '#FF00FF',
  'purple': '#800080'
} as const;

// Default fallback color
const DEFAULT_COLOR = '#000000';

/**
 * Validates if a string is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
};

/**
 * Converts 3-digit hex to 6-digit hex
 */
export const normalizeHexColor = (hex: string): string => {
  if (hex.length === 4) { // #abc -> #aabbcc
    const shortHex = hex.slice(1);
    return `#${shortHex[0]}${shortHex[0]}${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}`;
  }
  return hex.toUpperCase();
};

/**
 * Converts RGB values to hex
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.floor(value)));
  const toHex = (n: number) => {
    const hex = clamp(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

/**
 * Parses RGB/RGBA color string and returns RGB values
 */
export const parseRgbColor = (color: string): { r: number; g: number; b: number } | null => {
  const rgbMatch = color.match(/rgba?\(\s*([^)]+)\s*\)/);
  if (!rgbMatch) return null;
  
  const values = rgbMatch[1].split(',').map(v => parseInt(v.trim()) || 0);
  if (values.length < 3) return null;
  
  return {
    r: values[0],
    g: values[1],
    b: values[2]
  };
};

/**
 * Converts RGB/RGBA color strings to hex format
 * Supports formats: rgb(r,g,b), rgba(r,g,b,a), hex colors, and named colors
 */
export const convertColorToHex = (color: string): string => {
  if (!color || typeof color !== 'string') {
    return DEFAULT_COLOR;
  }

  const cleanColor = color.trim();
  
  if (!cleanColor) {
    return DEFAULT_COLOR;
  }

  // Handle hex colors
  if (cleanColor.startsWith('#')) {
    if (isValidHexColor(cleanColor)) {
      return normalizeHexColor(cleanColor);
    }
    return DEFAULT_COLOR;
  }

  // Handle RGB/RGBA colors
  if (cleanColor.startsWith('rgb')) {
    const rgb = parseRgbColor(cleanColor);
    if (rgb) {
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    return DEFAULT_COLOR;
  }

  // Handle named colors
  const namedColor = NAMED_COLORS[cleanColor.toLowerCase()];
  if (namedColor) {
    return namedColor;
  }

  // If we can't parse it, log warning and return default
  console.warn(`Unable to parse color: ${color}, defaulting to ${DEFAULT_COLOR}`);
  return DEFAULT_COLOR;
};

/**
 * Converts an array of categories with potentially RGB/RGBA colors to hex
 */
export const convertCategoriesToHex = (categories: Array<{ label: string; color: string; value?: number }>): Array<{ label: string; color: string; value: number }> => {
  return categories.map((cat, index) => ({
    label: cat.label || '',
    color: convertColorToHex(cat.color),
    value: cat.value ?? index
  }));
};

/**
 * Generates divergent colors for categorical data
 * Uses predefined colors for small sets, HSL distribution for larger sets
 */
export const generateDivergentColors = (count: number): string[] => {
  // Predefined well-contrasting colors for small sets
  const predefinedColors = [
    '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
    '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5'
  ];
  
  if (count <= predefinedColors.length) {
    return predefinedColors.slice(0, count);
  }
  
  // For larger sets, generate evenly distributed hues in HSL space
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    const saturation = 65 + (i % 3) * 10; // Vary saturation slightly
    const lightness = 45 + (i % 2) * 10;  // Vary lightness slightly
    colors.push(hslToHex(hue, saturation, lightness));
  }
  
  return colors;
};

/**
 * Converts HSL to hex color
 */
const hslToHex = (h: number, s: number, l: number): string => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
};
