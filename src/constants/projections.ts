export interface ProjectionOption {
  code: string;
  name: string;
}

export const PROJECTION_OPTIONS: ProjectionOption[] = [
  { code: 'EPSG:3035', name: 'ETRS89-extended / LAEA Europe' },
  { code: 'EPSG:3413', name: 'WGS 84 / NSIDC Sea Ice Polar Stereographic North' },
  { code: 'EPSG:3031', name: 'WGS 84 / Antarctic Polar Stereographic' },
  { code: 'EPSG:3857', name: 'WGS 84 / Pseudo-Mercator' },
  { code: 'EPSG:4326', name: 'WGS 84' },
];

export const DEFAULT_PROJECTION = 'EPSG:3857';
