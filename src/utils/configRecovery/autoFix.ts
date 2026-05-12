import { ValidationErrorDetails } from '@/types/config';

export interface AutoFixResult {
  config: any;
  appliedFixes: string[];
}

const inferFormatFromUrl = (url: unknown): string | undefined => {
  if (typeof url !== 'string') return undefined;
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.geojson')) return 'geojson';
  if (lower.endsWith('.json')) return 'geojson';
  if (lower.endsWith('.fgb')) return 'flatgeobuf';
  if (lower.endsWith('.tif') || lower.endsWith('.tiff')) return 'cog';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.includes('{z}') && lower.includes('{x}') && lower.includes('{y}')) return 'xyz';
  return undefined;
};

const fixSourceMeta = (source: any, fixes: string[], idx: number): any => {
  const name = source?.name || `Source ${idx + 1}`;
  const isBaseLayer = source?.isBaseLayer === true;
  const next = { ...source };

  // For base layers, only touch meta if it's already present (it's optional otherwise).
  // For non-base layers, meta is required — synthesise if missing.
  const metaPresent = next.meta !== undefined && next.meta !== null;
  if (!isBaseLayer && !metaPresent) {
    next.meta = {};
    fixes.push(`"${name}": added missing meta object`);
  }

  if (!isBaseLayer || metaPresent) {
    // Coerce non-object meta (e.g. a string) into an object so we can repair it.
    let meta: any = next.meta;
    if (typeof meta !== 'object' || Array.isArray(meta)) {
      meta = {};
      fixes.push(`"${name}": coerced meta to object`);
    } else {
      meta = { ...meta };
    }

    if (!meta.description || typeof meta.description !== 'string') {
      meta.description = isBaseLayer
        ? `Base layer: ${name}`
        : `Auto-generated description for ${name}`;
      fixes.push(`"${name}": filled meta.description`);
    }

    // Attribution: handle missing, string-form (legacy), or missing .text
    const attr = meta.attribution;
    if (attr === undefined || attr === null) {
      meta.attribution = { text: 'Data attribution not specified' };
      fixes.push(`"${name}": filled meta.attribution`);
    } else if (typeof attr === 'string') {
      meta.attribution = { text: attr };
      fixes.push(`"${name}": converted meta.attribution string to object`);
    } else if (typeof attr !== 'object' || Array.isArray(attr)) {
      meta.attribution = { text: 'Data attribution not specified' };
      fixes.push(`"${name}": replaced invalid meta.attribution`);
    } else if (!attr.text || typeof attr.text !== 'string') {
      meta.attribution = { ...attr, text: 'Data attribution not specified' };
      fixes.push(`"${name}": filled meta.attribution.text`);
    }
    next.meta = meta;
  }

  return next;
};

const fixSourceLayout = (source: any, fixes: string[], idx: number, groups: string[]): any => {
  const name = source?.name || `Source ${idx + 1}`;
  const isBaseLayer = source?.isBaseLayer === true;
  const layoutPresent = source?.layout && typeof source.layout === 'object' && !Array.isArray(source.layout);

  // If layout exists, ensure layerCard is a valid object (LayoutSchema requires it).
  if (layoutPresent) {
    const lc = source.layout.layerCard;
    const lcValid = lc && typeof lc === 'object' && !Array.isArray(lc);
    if (!lcValid) {
      fixes.push(`"${name}": added missing layout.layerCard`);
      return {
        ...source,
        layout: { ...source.layout, layerCard: { toggleable: true } },
      };
    }
    return source;
  }

  // No layout: base layers may omit it; non-base layers need a minimal one.
  if (isBaseLayer) return source;
  const fallbackGroup = groups[0] || 'Ungrouped';
  fixes.push(`"${name}": added minimal layout`);
  return {
    ...source,
    layout: {
      interfaceGroup: fallbackGroup,
      layerCard: { toggleable: true },
    },
  };
};

const fixSourceData = (source: any, fixes: string[], idx: number): any => {
  if (!source?.data) return source;
  const name = source?.name || `Source ${idx + 1}`;
  let next = source;

  // Wrap single-object data in an array
  if (!Array.isArray(next.data) && typeof next.data === 'object') {
    next = { ...next, data: [next.data] };
    fixes.push(`"${name}": wrapped data object in an array`);
  }

  if (Array.isArray(next.data)) {
    const newData = next.data.map((item: any, i: number) => {
      if (!item || typeof item !== 'object') return item;
      let updated = item;
      if (!updated.format) {
        const inferred = inferFormatFromUrl(updated.url);
        if (inferred) {
          updated = { ...updated, format: inferred };
          fixes.push(`"${name}": inferred data[${i}].format = ${inferred}`);
        }
      }
      if (updated.zIndex === undefined) {
        updated = { ...updated, zIndex: 0 };
        fixes.push(`"${name}": defaulted data[${i}].zIndex to 0`);
      }
      return updated;
    });
    next = { ...next, data: newData };
  }

  return next;
};

/**
 * Apply targeted repairs to sources flagged by validation errors. Only sources
 * referenced in the errors are touched, so a clean source is never modified.
 */
export function autoFixConfig(
  rawConfig: any,
  errors: ValidationErrorDetails[],
): AutoFixResult {
  const sources = Array.isArray(rawConfig?.sources) ? [...rawConfig.sources] : [];
  const fixes: string[] = [];

  // Indices flagged by validation
  const flagged = new Set<number>();
  for (const err of errors) {
    if (err.path?.[0] === 'sources' && err.path.length >= 2) {
      const idx = typeof err.path[1] === 'number' ? err.path[1] : Number(err.path[1]);
      if (Number.isInteger(idx)) flagged.add(idx);
    }
  }

  const groups: string[] = Array.isArray(rawConfig?.interfaceGroups)
    ? rawConfig.interfaceGroups.filter((g: any) => typeof g === 'string')
    : [];

  flagged.forEach((idx) => {
    if (idx < 0 || idx >= sources.length) return;
    let src = sources[idx];
    src = fixSourceMeta(src, fixes, idx);
    src = fixSourceLayout(src, fixes, idx, groups);
    src = fixSourceData(src, fixes, idx);
    sources[idx] = src;
  });

  return {
    config: { ...rawConfig, sources },
    appliedFixes: fixes,
  };
}
