/**
 * Geospatial Explorer App templates ("blueprints").
 *
 * Each template declares two simple wizard steps (template options, then data
 * content) and turns the answers into a complete raw APEx config. The output is
 * deliberately raw JSON so it goes through the normal import pipeline
 * (normalise + Zod validation) before reaching state.
 */

export interface WizardOption {
  value: string;
  label: string;
  description?: string;
}

export interface WizardField {
  id: string;
  label: string;
  type: 'choice' | 'date' | 'text';
  options?: WizardOption[];
  default: string;
  help?: string;
  placeholder?: string;
  /** Only show this field when another field has one of these values. */
  showIf?: { field: string; in: string[] };
}

export interface WizardStep {
  title: string;
  description: string;
  fields: WizardField[];
}

export type WizardValues = Record<string, string>;

export interface AppTemplateParams {
  title: string;
  center: [number, number];
  zoom: number;
  values: WizardValues;
}

export interface AppTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bestFor: string[];
  defaults: { title: string; center: [number, number]; zoom: number; layoutVariant?: 'fullscreen' | 'sidebar' };
  optionsStep: WizardStep;
  dataStep: WizardStep;
  build: (p: AppTemplateParams) => Record<string, unknown>;
}

export interface LocationPreset {
  label: string;
  group: 'Global' | 'Continents' | 'Countries' | 'Cities';
  center: [number, number];
  zoom: number;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'World', group: 'Global', center: [0, 20], zoom: 2 },
  { label: 'Europe', group: 'Continents', center: [15, 52], zoom: 4 },
  { label: 'Africa', group: 'Continents', center: [20, 2], zoom: 3 },
  { label: 'Asia', group: 'Continents', center: [90, 35], zoom: 3 },
  { label: 'North America', group: 'Continents', center: [-100, 45], zoom: 3 },
  { label: 'South America', group: 'Continents', center: [-60, -15], zoom: 3 },
  { label: 'Oceania', group: 'Continents', center: [140, -25], zoom: 3 },
  { label: 'United Kingdom', group: 'Countries', center: [-2.5, 54.5], zoom: 6 },
  { label: 'France', group: 'Countries', center: [2.5, 46.5], zoom: 6 },
  { label: 'Germany', group: 'Countries', center: [10.4, 51.2], zoom: 6 },
  { label: 'Spain', group: 'Countries', center: [-3.7, 40.2], zoom: 6 },
  { label: 'Italy', group: 'Countries', center: [12.5, 42.5], zoom: 6 },
  { label: 'Netherlands', group: 'Countries', center: [5.3, 52.2], zoom: 7 },
  { label: 'Ukraine', group: 'Countries', center: [31.2, 48.8], zoom: 6 },
  { label: 'Kenya', group: 'Countries', center: [37.9, 0.2], zoom: 6 },
  { label: 'Bristol, UK', group: 'Cities', center: [-2.6, 51.45], zoom: 11 },
  { label: 'Paris', group: 'Cities', center: [2.35, 48.86], zoom: 11 },
  { label: 'Rome', group: 'Cities', center: [12.5, 41.9], zoom: 11 },
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
  layout: {
    design: { variant: p.values.layoutVariant || 'sidebar' },
    navigation: { logo: LOGO, title: p.title },
  },
  interfaceGroups: [group],
  exclusivitySets: [],
  mapConstraints: { zoom: p.zoom, center: p.center, projection: 'EPSG:3857' },
  projections: [],
  workflows: [],
  stories: [],
  services: [],
  sources,
});

/** Initial wizard values for a template (options + data step defaults). */
export const getDefaultValues = (t: AppTemplate): WizardValues => ({
  ...Object.fromEntries([...t.optionsStep.fields, ...t.dataStep.fields].map((f) => [f.id, f.default])),
  layoutVariant: t.defaults.layoutVariant ?? 'sidebar',
});

/** Shared last wizard step: same layout variants as the Config Builder settings. */
export const FINAL_TWEAKS_STEP: WizardStep = {
  title: 'Final tweaks',
  description: 'Choose how the Explorer lays out the map and its panels.',
  fields: [
    {
      id: 'layoutVariant',
      label: 'Layout variant',
      type: 'choice',
      default: 'sidebar',
      options: [
        { value: 'fullscreen', label: 'Fullscreen', description: 'The map fills the screen, with panels floating on top.' },
        { value: 'sidebar', label: 'Sidebar', description: 'Panels sit in a sidebar beside the map.' },
      ],
    },
  ],
};

export const isFieldVisible = (f: WizardField, values: WizardValues) =>
  !f.showIf || f.showIf.in.includes(values[f.showIf.field] ?? '');

/** Build a STAC item-search URL with bbox (around centre), datetime and limit. */
export const buildStacSearchUrl = (
  collectionUrl: string,
  center: [number, number],
  zoom: number,
  start = '2025-06-01',
  end = '2025-08-31',
): string => {
  const half = Math.min(10, Math.max(0.05, 180 / Math.pow(2, zoom)));
  const bbox = [center[0] - half, center[1] - half / 2, center[0] + half, center[1] + half / 2]
    .map((n) => n.toFixed(3))
    .join(',');
  const base = collectionUrl.replace(/\/+$/, '');
  const itemsUrl = /\/items$/.test(base) ? base : `${base}/items`;
  return `${itemsUrl}?bbox=${bbox}&datetime=${start}T00:00:00Z/${end}T23:59:59Z&limit=20`;
};

/* ---------- Change & Swipe ---------- */

const S2_YEARS = ['2016', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
const s2CloudlessLayer = (year: string) => (year === '2016' ? 's2cloudless_3857' : `s2cloudless-${year}_3857`);
const yearOptions = S2_YEARS.map((y) => ({ value: y, label: y }));

/* ---------- STAC Monitor ---------- */

const STAC_PERIODS: Record<string, [string, string]> = {
  'summer-2025': ['2025-06-01', '2025-08-31'],
  'spring-2025': ['2025-03-01', '2025-05-31'],
  'year-2025': ['2025-01-01', '2025-12-31'],
  'summer-2024': ['2024-06-01', '2024-08-31'],
};

const STAC_MISSIONS: Record<string, { collection: string; asset: string; name: string; attribution: string }> = {
  's2-c1': {
    collection: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a',
    asset: 'visual',
    name: 'Sentinel-2 true colour',
    attribution: 'Contains modified Copernicus Sentinel data',
  },
  's2-l2a': {
    collection: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a',
    asset: 'visual',
    name: 'Sentinel-2 true colour (legacy collection)',
    attribution: 'Contains modified Copernicus Sentinel data',
  },
};

/* ---------- Vector ---------- */

const HV_GRID_URL = 'https://sef-prod-public.obs.eu-nl.otc.t-systems.com/energy/grid/eu_hv_grid.geojson';

export const APP_TEMPLATES: AppTemplate[] = [
  {
    id: 'change-swipe',
    name: 'Change & Swipe Viewer',
    tagline: 'Compare two moments side by side',
    description: 'A swipe comparison between two years of imagery. Ideal for showing change after floods, fires or construction.',
    bestFor: ['Before / after', 'Disaster response', 'Land change'],
    defaults: { title: 'Change Explorer', center: [15, 52], zoom: 4 },
    optionsStep: {
      title: 'Before and after',
      description: 'Pick the two years to compare. The "before" image shows on the left of the swipe, "after" on the right.',
      fields: [
        { id: 'before', label: 'Before', type: 'choice', options: yearOptions, default: '2018' },
        { id: 'after', label: 'After', type: 'choice', options: yearOptions, default: '2024' },
      ],
    },
    dataStep: {
      title: 'Imagery',
      description: 'Choose where the before and after images come from.',
      fields: [
        {
          id: 'source',
          label: 'Imagery source',
          type: 'choice',
          default: 'eox',
          options: [
            { value: 'eox', label: 'Sentinel-2 cloudless (EOX)', description: 'Cloud-free yearly mosaics of the whole world.' },
            { value: 'custom', label: 'My own map service', description: 'A WMS service with one layer per year.' },
          ],
        },
        { id: 'wmsUrl', label: 'WMS service URL', type: 'text', default: '', placeholder: 'https://…/wms', showIf: { field: 'source', in: ['custom'] } },
        { id: 'beforeLayer', label: 'Before layer name', type: 'text', default: '', showIf: { field: 'source', in: ['custom'] } },
        { id: 'afterLayer', label: 'After layer name', type: 'text', default: '', showIf: { field: 'source', in: ['custom'] } },
      ],
    },
    build: (p) => {
      const v = p.values;
      const custom = v.source === 'custom';
      const url = custom ? v.wmsUrl : 'https://tiles.maps.eox.at/wms';
      const beforeLayer = custom ? v.beforeLayer : s2CloudlessLayer(v.before);
      const afterLayer = custom ? v.afterLayer : s2CloudlessLayer(v.after);
      const group = 'Change comparison';
      return shell(p, group, [
        osmBase,
        {
          id: `change-${v.before}-vs-${v.after}`,
          name: custom ? `Before vs after` : `Sentinel-2 cloudless: ${v.before} vs ${v.after}`,
          isActive: true,
          isBaseLayer: false,
          isSwipeLayer: true,
          data: [
            { url, format: 'wms', zIndex: 50, layers: beforeLayer, position: 'left' },
            { url, format: 'wms', zIndex: 50, layers: afterLayer, position: 'right' },
          ],
          meta: {
            description: custom
              ? 'Swipe between the before (left) and after (right) images.'
              : `Swipe between the ${v.before} (left) and ${v.after} (right) Sentinel-2 cloudless mosaics.`,
            attribution: custom
              ? { text: 'Data attribution not specified' }
              : { text: 'Sentinel-2 cloudless by EOX (contains modified Copernicus data)', url: 'https://s2maps.eu' },
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
    description: 'Finds satellite scenes over your area for a chosen period and shows them with time controls.',
    bestFor: ['Sentinel-2 archives', 'Seasonal monitoring', 'Agriculture'],
    defaults: { title: 'Satellite Monitor', center: [-2.6, 51.45], zoom: 11 },
    optionsStep: {
      title: 'Time period',
      description: 'Which period should the app show scenes from?',
      fields: [
        {
          id: 'period',
          label: 'Period',
          type: 'choice',
          default: 'summer-2025',
          options: [
            { value: 'summer-2025', label: 'Summer 2025' },
            { value: 'spring-2025', label: 'Spring 2025' },
            { value: 'year-2025', label: 'All of 2025' },
            { value: 'summer-2024', label: 'Summer 2024' },
            { value: 'custom', label: 'Custom dates' },
          ],
        },
        { id: 'start', label: 'From', type: 'date', default: '2025-06-01', showIf: { field: 'period', in: ['custom'] } },
        { id: 'end', label: 'To', type: 'date', default: '2025-08-31', showIf: { field: 'period', in: ['custom'] } },
      ],
    },
    dataStep: {
      title: 'Satellite data',
      description: 'Choose the satellite collection to search.',
      fields: [
        {
          id: 'mission',
          label: 'Collection',
          type: 'choice',
          default: 's2-c1',
          options: [
            { value: 's2-c1', label: 'Sentinel-2 L2A (Earth Search)', description: 'Latest processing, true-colour imagery.' },
            { value: 's2-l2a', label: 'Sentinel-2 L2A legacy (Earth Search)', description: 'Original collection, true-colour imagery.' },
            { value: 'custom', label: 'Another STAC collection', description: 'Any collection with a viewable image asset.' },
          ],
          help: 'Sentinel-1 radar on Earth Search is not publicly readable, so it is not offered yet.',
        },
        { id: 'collectionUrl', label: 'STAC collection URL', type: 'text', default: '', placeholder: 'https://…/collections/…', showIf: { field: 'mission', in: ['custom'] } },
        { id: 'asset', label: 'Image asset name', type: 'text', default: 'visual', showIf: { field: 'mission', in: ['custom'] } },
      ],
    },
    build: (p) => {
      const v = p.values;
      const [start, end] = v.period === 'custom' ? [v.start, v.end] : STAC_PERIODS[v.period] ?? STAC_PERIODS['summer-2025'];
      const preset = STAC_MISSIONS[v.mission];
      const collection = preset ? preset.collection : v.collectionUrl;
      const asset = preset ? preset.asset : v.asset || 'visual';
      const group = 'Satellite scenes';
      return shell(p, group, [
        darkBase,
        {
          id: 'stac-scenes',
          name: `${preset?.name ?? 'Satellite scenes'} (${start} to ${end})`,
          isActive: true,
          isBaseLayer: false,
          data: [
            {
              url: buildStacSearchUrl(collection, p.center, p.zoom, start, end),
              format: 'stac',
              zIndex: 50,
              minZoom: 8,
              maxZoom: 20,
              assets: [asset],
              assetFormats: { [asset]: 'cog' },
            },
          ],
          meta: {
            description: `Scenes fetched live from the STAC catalogue for the map area, ${start} to ${end}.`,
            attribution: { text: preset?.attribution ?? 'Data attribution not specified', url: collection },
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
    description: 'A vector dataset styled by attribute with a matching legend.',
    bestFor: ['Infrastructure', 'GeoJSON / FlatGeobuf', 'Asset registers'],
    defaults: { title: 'Asset Inspector', center: [10, 50], zoom: 4 },
    optionsStep: {
      title: 'Styling',
      description: 'How should the features be coloured?',
      fields: [
        {
          id: 'styling',
          label: 'Colouring',
          type: 'choice',
          default: 'categorised',
          options: [
            { value: 'categorised', label: 'By category', description: 'Different colours per class, with a legend (grid only).' },
            { value: 'simple', label: 'Single colour', description: 'One clean colour for every feature.' },
          ],
        },
      ],
    },
    dataStep: {
      title: 'Vector data',
      description: 'Choose the features to show.',
      fields: [
        {
          id: 'dataset',
          label: 'Dataset',
          type: 'choice',
          default: 'hv-grid',
          options: [
            { value: 'hv-grid', label: 'European high-voltage grid', description: 'Transmission lines by voltage class.' },
            { value: 'custom', label: 'My own file', description: 'A GeoJSON or FlatGeobuf web address.' },
          ],
        },
        { id: 'url', label: 'GeoJSON or FlatGeobuf URL', type: 'text', default: '', placeholder: 'https://…/data.geojson', showIf: { field: 'dataset', in: ['custom'] } },
      ],
    },
    build: (p) => {
      const v = p.values;
      const isGrid = v.dataset !== 'custom';
      const url = isGrid ? HV_GRID_URL : v.url;
      const format = /\.fgb(\?|$)/i.test(url) ? 'flatgeobuf' : 'geojson';
      const group = 'Assets';
      const categorised = isGrid && v.styling === 'categorised';
      const style = categorised
        ? [
            {
              'stroke-color': ['match', ['get', 'class'], '220 kV', '#FFC000', '400 kV', '#ED7D31', '300 kV', '#C00000', '≥500 kV', '#7030A0', '#0070C0'],
              'stroke-width': 2,
              _name: 'Categorised by class',
            },
          ]
        : [{ 'stroke-color': '#3399CC', 'stroke-width': 2, 'fill-color': 'rgba(51,153,204,0.25)', 'circle-radius': 5, 'circle-fill-color': '#3399CC', _name: 'Simple' }];
      const categories = categorised
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
          name: isGrid ? 'High-voltage transmission grid' : 'Assets',
          isActive: true,
          isBaseLayer: false,
          data: [{ url, format, zIndex: 60, style }],
          meta: {
            description: isGrid ? 'European transmission lines (220–750 kV AC and HVDC).' : 'Vector assets.',
            attribution: isGrid
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

/** Returns a user-facing problem with the current step's answers, or null. */
export const validateStep = (step: WizardStep, values: WizardValues): string | null => {
  for (const f of step.fields) {
    if (!isFieldVisible(f, values)) continue;
    if ((f.type === 'text' || f.type === 'date') && !values[f.id]?.trim()) return `Please fill in "${f.label}".`;
    if (f.type === 'text' && /url/i.test(f.label) && !/^https?:\/\//i.test(values[f.id])) return `"${f.label}" must start with http:// or https://.`;
  }
  return null;
};
