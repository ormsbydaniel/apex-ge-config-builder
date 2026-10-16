/**
 * Geospatial Explorer App templates ("blueprints").
 *
 * Each template turns a small set of user parameters into a complete raw
 * APEx config. The output is deliberately raw JSON so it goes through the
 * normal import pipeline (normalise + Zod validation) before reaching state.
 */

export interface AppTemplateParams {
  title: string;
  center: [number, number];
  zoom: number;
  /** Template-specific primary data URL (optional override). */
  dataUrl?: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bestFor: string[];
  dataLabel: string;
  defaults: AppTemplateParams & { dataUrl: string };
  build: (p: AppTemplateParams) => Record<string, unknown>;
}

export interface LocationPreset {
  label: string;
  center: [number, number];
  zoom: number;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'World', center: [0, 20], zoom: 2 },
  { label: 'Europe', center: [15, 52], zoom: 4 },
  { label: 'United Kingdom', center: [-2.5, 54.5], zoom: 6 },
  { label: 'Bristol, UK', center: [-2.6, 51.45], zoom: 11 },
  { label: 'North America', center: [-100, 45], zoom: 3 },
  { label: 'Africa', center: [20, 2], zoom: 3 },
];

const LOGO = 'https://www.esa.int/extension/pillars/design/pillars/images/ESA_Logo.svg';

const osmBase = {
  id: 'open-streetmap',
  name: 'OpenStreetMap',
  isActive: true,
  isBaseLayer: true,
  data: [{ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', format: 'xyz', zIndex: 10 }],
  meta: {
    description: 'Base layer: OpenStreetMap',
    attribution: { text: 'Map data © OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' },
    categories: [],
  },
  exclusivitySets: [],
};

const darkBase = {
  id: 'carto-dark',
  name: 'CARTO Dark Matter',
  isActive: true,
  isBaseLayer: true,
  data: [{ url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', format: 'xyz', zIndex: 10 }],
  meta: {
    description: 'Base layer: CARTO Dark Matter',
    attribution: { text: '© OpenStreetMap contributors © CARTO', url: 'https://carto.com/attributions' },
    categories: [],
  },
  exclusivitySets: [],
};

const layerLayout = (group: string, temporal = false) => ({
  interfaceGroup: group,
  contentLocation: 'infoPanel',
  layerCard: { toggleable: true },
  infoPanel: {
    legend: { type: 'swatch' },
    controls: {
      opacitySlider: true,
      zoomToCenter: true,
      temporalControls: temporal,
      constraintSlider: false,
      blendControls: false,
    },
  },
});

const shell = (p: AppTemplateParams, group: string, sources: unknown[]) => ({
  version: '1.0.0',
  exportPrefix: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app',
  layout: { navigation: { logo: LOGO, title: p.title } },
  interfaceGroups: [group],
  exclusivitySets: [],
  mapConstraints: { zoom: p.zoom, center: p.center, projection: 'EPSG:3857' },
  projections: [],
  workflows: [],
  stories: [],
  services: [],
  sources,
});

/** Build a STAC item-search URL with bbox (around centre), datetime and limit. */
export const buildStacSearchUrl = (collectionUrl: string, center: [number, number], zoom: number): string => {
  const half = Math.min(10, Math.max(0.05, 180 / Math.pow(2, zoom)));
  const bbox = [center[0] - half, center[1] - half / 2, center[0] + half, center[1] + half / 2]
    .map((n) => n.toFixed(3))
    .join(',');
  const base = collectionUrl.replace(/\/+$/, '');
  const itemsUrl = /\/items$/.test(base) ? base : `${base}/items`;
  return `${itemsUrl}?bbox=${bbox}&datetime=2025-06-01T00:00:00Z/2025-08-31T23:59:59Z&limit=20`;
};

export const APP_TEMPLATES: AppTemplate[] = [
  {
    id: 'change-swipe',
    name: 'Change & Swipe Viewer',
    tagline: 'Compare two moments side by side',
    description:
      'A swipe comparison between two years of cloud-free Sentinel-2 imagery. Ideal for showing change after floods, fires or construction.',
    bestFor: ['Before / after', 'Disaster response', 'Land change'],
    dataLabel: 'WMS service URL (EOX Sentinel-2 cloudless layers)',
    defaults: {
      title: 'Change Explorer',
      center: [15, 52],
      zoom: 4,
      dataUrl: 'https://tiles.maps.eox.at/wms',
    },
    build: (p) => {
      const url = p.dataUrl || 'https://tiles.maps.eox.at/wms';
      const group = 'Change comparison';
      return shell(p, group, [
        osmBase,
        {
          id: 'sentinel-2-change-2018-vs-2024',
          name: 'Sentinel-2 cloudless: 2018 vs 2024',
          isActive: true,
          isBaseLayer: false,
          data: [
            { url, format: 'wms', zIndex: 50, layers: 's2cloudless-2018_3857', position: 'left' },
            { url, format: 'wms', zIndex: 50, layers: 's2cloudless-2024_3857', position: 'right' },
          ],
          meta: {
            description: 'Swipe between the 2018 (left) and 2024 (right) Sentinel-2 cloudless mosaics.',
            attribution: { text: 'Sentinel-2 cloudless by EOX (contains modified Copernicus data)', url: 'https://s2maps.eu' },
            categories: [],
          },
          layout: layerLayout(group),
          exclusivitySets: [],
        },
      ]);
    },
  },
  {
    id: 'stac-monitor',
    name: 'Satellite STAC Monitor',
    tagline: 'Live satellite scenes from a STAC catalogue',
    description:
      'Queries a STAC collection for scenes over your area and season, displayed as true-colour imagery with time controls.',
    bestFor: ['Sentinel-2 archives', 'Seasonal monitoring', 'Agriculture'],
    dataLabel: 'STAC collection URL',
    defaults: {
      title: 'Satellite Monitor',
      center: [-2.6, 51.45],
      zoom: 11,
      dataUrl: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a',
    },
    build: (p) => {
      const collection = p.dataUrl || 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a';
      const group = 'Satellite scenes';
      return shell(p, group, [
        darkBase,
        {
          id: 'stac-true-colour',
          name: 'Sentinel-2 true colour (summer 2025)',
          isActive: true,
          isBaseLayer: false,
          data: [
            {
              url: buildStacSearchUrl(collection, p.center, p.zoom),
              format: 'stac',
              zIndex: 50,
              minZoom: 8,
              maxZoom: 20,
              assets: ['visual'],
              assetFormats: { visual: 'cog' },
            },
          ],
          meta: {
            description: 'Sentinel-2 L2A scenes fetched live from the STAC catalogue for the map area, June–August 2025.',
            attribution: { text: 'Contains modified Copernicus Sentinel data', url: 'https://earth-search.aws.element84.com/v1' },
            categories: [],
          },
          layout: layerLayout(group, true),
          exclusivitySets: [],
        },
      ]);
    },
  },
  {
    id: 'vector-inspector',
    name: 'Vector Asset Inspector',
    tagline: 'Styled features with a categorised legend',
    description:
      'A vector network styled by attribute with a matching legend. Uses the European high-voltage grid as a starting point.',
    bestFor: ['Infrastructure', 'GeoJSON / FlatGeobuf', 'Asset registers'],
    dataLabel: 'GeoJSON or FlatGeobuf URL',
    defaults: {
      title: 'Asset Inspector',
      center: [10, 50],
      zoom: 4,
      dataUrl: 'https://sef-prod-public.obs.eu-nl.otc.t-systems.com/energy/grid/eu_hv_grid.geojson',
    },
    build: (p) => {
      const url = p.dataUrl || 'https://sef-prod-public.obs.eu-nl.otc.t-systems.com/energy/grid/eu_hv_grid.geojson';
      const format = /\.fgb(\?|$)/i.test(url) ? 'flatgeobuf' : 'geojson';
      const group = 'Assets';
      const isDefault = url.includes('eu_hv_grid');
      const style = isDefault
        ? [
            {
              'stroke-color': ['match', ['get', 'class'], '220 kV', '#FFC000', '400 kV', '#ED7D31', '300 kV', '#C00000', '≥500 kV', '#7030A0', '#0070C0'],
              'stroke-width': 2,
              _name: 'Categorised by class',
            },
          ]
        : [{ 'stroke-color': '#3399CC', 'stroke-width': 2, 'fill-color': 'rgba(51,153,204,0.25)', 'circle-radius': 5, 'circle-fill-color': '#3399CC', _name: 'Simple' }];
      const categories = isDefault
        ? [
            { color: '#FFC000', label: '220 kV', value: 0 },
            { color: '#ED7D31', label: '300 kV', value: 0 },
            { color: '#C00000', label: '400 kV', value: 0 },
            { color: '#7030A0', label: '≥500 kV', value: 0 },
            { color: '#0070C0', label: 'Other / HVDC', value: 0 },
          ]
        : [];
      return shell(p, group, [
        darkBase,
        {
          id: 'vector-assets',
          name: isDefault ? 'High-voltage transmission grid' : 'Assets',
          isActive: true,
          isBaseLayer: false,
          data: [{ url, format, zIndex: 60, style }],
          meta: {
            description: isDefault
              ? 'European transmission lines (220–750 kV AC and HVDC), coloured by voltage class.'
              : 'Vector assets.',
            attribution: isDefault
              ? { text: '© OpenStreetMap contributors (ODbL), processed by PyPSA-Eur / TU Berlin', url: 'https://zenodo.org/records/14144752' }
              : { text: 'Data attribution not specified' },
            categories,
          },
          layout: layerLayout(group),
          exclusivitySets: [],
        },
      ]);
    },
  },
];
