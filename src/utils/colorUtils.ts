
/**
 * Converts RGB/RGBA color strings to hex format
 * Supports formats: rgb(r,g,b), rgba(r,g,b,a), and already hex colors
 */
export const convertColorToHex = (color: string): string => {
  if (!color || typeof color !== 'string') {
    return '#000000';
  }

  // Clean up the color string
  const cleanColor = color.trim();

  // If already hex, validate and return
  if (cleanColor.startsWith('#')) {
    // Ensure it's a valid hex color
    const hexMatch = cleanColor.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      // Convert 3-digit hex to 6-digit
      if (hexMatch[1].length === 3) {
        const shortHex = hexMatch[1];
        return `#${shortHex[0]}${shortHex[0]}${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}`;
      }
      return cleanColor.toUpperCase();
    }
    return '#000000'; // Invalid hex format
  }

  // Handle rgb() and rgba() formats
  const rgbMatch = cleanColor.match(/rgba?\(\s*([^)]+)\s*\)/);
  if (rgbMatch) {
    const values = rgbMatch[1].split(',').map(v => v.trim());
    const r = Math.max(0, Math.min(255, parseInt(values[0]) || 0));
    const g = Math.max(0, Math.min(255, parseInt(values[1]) || 0));
    const b = Math.max(0, Math.min(255, parseInt(values[2]) || 0));

    // Convert to hex
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  // Handle named colors (basic ones)
  const namedColors: { [key: string]: string } = {
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
  };

  const lowerColor = cleanColor.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }

  // If we can't parse it, return default black
  console.warn(`Unable to parse color: ${color}, defaulting to black`);
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
