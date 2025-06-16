
/**
 * Converts RGB/RGBA color strings to hex format
 * Supports formats: rgb(r,g,b), rgba(r,g,b,a), and already hex colors
 */
export const convertColorToHex = (color: string): string => {
  if (!color || typeof color !== 'string') {
    return '#000000';
  }

  // If already hex, return as is
  if (color.startsWith('#')) {
    return color;
  }

  // Handle rgb() and rgba() formats
  const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const values = rgbMatch[1].split(',').map(v => v.trim());
    const r = parseInt(values[0]) || 0;
    const g = parseInt(values[1]) || 0;
    const b = parseInt(values[2]) || 0;

    // Convert to hex
    const toHex = (n: number) => {
      const hex = Math.max(0, Math.min(255, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // If we can't parse it, return default black
  return '#000000';
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
