import { describe, it, expect } from 'vitest';
import { flattenProviders, resolveTemplate, toBaseLayer, parseHtmlAttributionUrl } from '../xyzServices';

const json = {
  OpenStreetMap: {
    Mapnik: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', name: 'OpenStreetMap.Mapnik', attribution: '(C) OpenStreetMap contributors', html_attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>', max_zoom: 19 },
  },
  CartoDB: {
    Positron: { url: 'https://{s}.basemaps.cartocdn.com/{variant}/{z}/{x}/{y}{r}.png?key={apikey}', name: 'CartoDB.Positron', subdomains: 'abcd', variant: 'light_all', apikey: '<insert your API key here>', attribution: 'x' },
  },
  Stadia: {
    Dark: { url: 'https://tiles.stadiamaps.com/{z}/{x}/{y}.png?api_key={api_key}', name: 'Stadia.AlidadeSmoothDark', api_key: '<insert your api key here>' },
  },
  Broken: { url: 'https://example.com/wms', name: 'Broken' },
};

describe('xyzServices', () => {
  const entries = flattenProviders(json);
  const byId = (id: string) => entries.find((e) => e.id === id)!;

  it('flattens providers and skips non-XYZ templates', () => {
    expect(entries.map((e) => e.id).sort()).toEqual(['CartoDB.Positron', 'OpenStreetMap.Mapnik', 'Stadia.AlidadeSmoothDark']);
  });

  it('detects key requirements and optional keys', () => {
    expect(byId('Stadia.AlidadeSmoothDark').requiresKey).toBe(true);
    expect(byId('CartoDB.Positron').requiresKey).toBe(false);
    expect(byId('CartoDB.Positron').category).toBe('Light');
    expect(byId('Stadia.AlidadeSmoothDark').category).toBe('Dark');
  });

  it('resolves placeholders', () => {
    expect(resolveTemplate(byId('CartoDB.Positron'))).toBe('https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png');
    expect(resolveTemplate(byId('Stadia.AlidadeSmoothDark'), 'abc')).toBe('https://tiles.stadiamaps.com/{z}/{x}/{y}.png?api_key=abc');
  });

  it('parses attribution links and builds a base layer', () => {
    expect(parseHtmlAttributionUrl('<a href="https://a.b/c">x</a>')).toBe('https://a.b/c');
    const layer: any = toBaseLayer(byId('OpenStreetMap.Mapnik'), { center: [0, 0] });
    expect(layer.isBaseLayer).toBe(true);
    expect(layer.data[0]).toMatchObject({ format: 'xyz', maxZoom: 19 });
    expect(layer.meta.attribution).toEqual({ text: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' });
    expect(layer.preview).toBe('https://tile.openstreetmap.org/4/8/8.png');
  });
});
