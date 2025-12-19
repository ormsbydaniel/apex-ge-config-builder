/**
 * Color utility functions for chart traces
 */

export const TRACE_COLORS = [
  '#2563eb', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * Get the next available color for a new trace
 */
export function getNextColor(existingTraces: { line?: { color?: string } }[]): string {
  const usedColors = existingTraces.map(t => t.line?.color).filter(Boolean);
  const availableColor = TRACE_COLORS.find(c => !usedColors.includes(c));
  return availableColor || TRACE_COLORS[existingTraces.length % TRACE_COLORS.length];
}

/**
 * Convert hex color to rgba with specified alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get contrasting text color (black or white) based on background luminance
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Extract hex color from rgba or hex string
 */
export function extractHexColor(color: string | undefined, fallback = '#2563eb'): string {
  if (!color) return fallback;
  if (color.startsWith('#')) return color;
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return fallback;
}

/**
 * Extract opacity from rgba color string
 */
export function extractOpacity(color: string | undefined, fallback = 0.3): number {
  if (!color) return fallback;
  const rgbaMatch = color.match(/rgba?\([^,]+,\s*[^,]+,\s*[^,]+,\s*([0-9.]+)\)/);
  return rgbaMatch ? parseFloat(rgbaMatch[1]) : fallback;
}
