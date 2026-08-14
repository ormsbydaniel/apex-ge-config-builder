/**
 * Maps colormap names as they appear in external catalogues (matplotlib, cmocean,
 * colorbrewer, GDAL, etc.) onto the preset ramps available in this builder.
 */

import { COLORMAP_DATA } from '@/constants/colormapData';

/** Aliases -> our preset name. Keys must already be normalised (see normaliseName). */
const COLORMAP_ALIASES: Record<string, string> = {
  // Greyscale
  gray: 'greys',
  grey: 'greys',
  grays: 'greys',
  greyscale: 'greys',
  grayscale: 'greys',
  binary: 'greys',
  blackwhite: 'greys',

  // Perceptual / matplotlib
  viridis: 'viridis',
  inferno: 'inferno',
  magma: 'magma',
  plasma: 'plasma',
  turbo: 'jet',
  nipyspectral: 'rainbow',
  gistrainbow: 'rainbow',
  gistearth: 'earth',
  gistheat: 'hot',
  afmhot: 'hot',
  coolwarm: 'bluered',
  bwr: 'bluered',
  seismic: 'bluered',
  spectral: 'rainbow-soft',
  terrain: 'earth',
  ocean: 'bathymetry',

  // Colorbrewer style
  rdbu: 'rdbu',
  rdylbu: 'bluered',
  rdylgn: 'rainbow-soft',
  ylgnbu: 'yignbu',
  yignbu: 'yignbu',
  ylorrd: 'yiorrd',
  yiorrd: 'yiorrd',
  gnbu: 'yignbu',
  bugn: 'greens',
  greens: 'greens',
  ylgn: 'greens',
  reds: 'hot',
  blues: 'yignbu',

  // cmocean
  thermal: 'temperature',
  haline: 'salinity',
  deep: 'bathymetry',
  dense: 'density',
  algae: 'chlorophyll',
  matter: 'cdom',
  turbid: 'turbidity',
  speed: 'velocity-green',
  amp: 'yiorrd',
  balance: 'bluered',
  phase: 'phase',
  solar: 'blackbody',
};

/** Lowercase and strip separators so 'Rd-Yl_Bu' and 'rdylbu' compare equal. */
const normaliseName = (name: string): string =>
  name.trim().toLowerCase().replace(/[\s_\-.]/g, '');

export interface ResolvedColormapName {
  /** A key that exists in COLORMAP_DATA. */
  name: string;
  /** True when the source name carried a reverse suffix such as '_r'. */
  reverse: boolean;
  /** True when the name matched a preset directly rather than via an alias. */
  exact: boolean;
}

/**
 * Resolves an external colormap name onto one of our presets, honouring the
 * matplotlib '_r' reversed suffix. Returns null when nothing sensible matches.
 */
export const resolveColormapName = (
  rawName?: string | null,
): ResolvedColormapName | null => {
  if (!rawName || !rawName.trim()) return null;

  let working = rawName.trim();
  let reverse = false;
  const reversedSuffix = /(_r|-r|\breversed|\breverse)$/i;
  if (reversedSuffix.test(working)) {
    reverse = true;
    working = working.replace(reversedSuffix, '');
  }

  const normalised = normaliseName(working);
  if (!normalised) return null;

  // Direct hit on a preset key (also covers hyphenated keys like 'cool-water').
  for (const key of Object.keys(COLORMAP_DATA)) {
    if (normaliseName(key) === normalised) {
      return { name: key, reverse, exact: true };
    }
  }

  const alias = COLORMAP_ALIASES[normalised];
  if (alias && alias in COLORMAP_DATA) {
    return { name: alias, reverse, exact: false };
  }

  return null;
};
