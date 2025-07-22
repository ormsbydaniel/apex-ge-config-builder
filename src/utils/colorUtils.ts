
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
