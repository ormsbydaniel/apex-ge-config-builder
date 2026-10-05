import type { DataSourceItem } from '@/types/dataSource';
import { copyVisualisation, firstCogIndex, isCog } from './perDataset';
import { matchRecipe, RGB_RECIPES } from './recipes';
import { INDEX_RECIPES, buildIndexStyle, withRecipePalette, type SpectralIndexConfig } from './indices';

/** Change composite bands without replacing each dataset's existing RGB ranges. */
export function applyCompositeStyle(
  data: DataSourceItem[], scope: number, bands: number[], all: boolean,
  makeStyle: (item: DataSourceItem) => DataSourceItem['style'], styleDirty = true, rangeDirty = false,
): DataSourceItem[] {
  const first = firstCogIndex(data);
  return data.map((item, i) => {
    if (!isCog(item)) return item;
    if (!all && i !== scope) {
      // A first-dataset-only change must not quietly alter its followers.
      if ((styleDirty || rangeDirty) && scope === first && i !== first && !item.styleSource) {
        return copyVisualisation(item, item, 'own');
      }
      return item;
    }
    if (!all && !styleDirty && scope !== first) {
      const { batchStretch, ...rest } = item;
      return { ...rest, style: makeStyle(item), styleSource: 'own' } as DataSourceItem;
    }
    if (!all && !styleDirty && scope === first) {
      return { ...item, style: makeStyle(item) };
    }
    // "All datasets" unifies every COG dataset (including ones marked 'own'),
    // since it is now the only copy-to-all action in the editor.
    const { spectralIndex, batchStretch, ...rest } = item;
    return {
      ...rest, convertToRGB: true, bands: [...bands], style: makeStyle(item),
      styleSource: all || i === first ? undefined : 'own',
    } as DataSourceItem;
  });
}

/**
 * Apply a spectral index to one dataset ("This dataset") or every COG dataset
 * ("All datasets"). Works from either a composite or another index.
 */
export function applyIndexStyle(
  data: DataSourceItem[], scope: number, cfg: SpectralIndexConfig, all: boolean,
): DataSourceItem[] {
  const first = firstCogIndex(data);
  const styledConfig = withRecipePalette(cfg);
  return data.map((item, i) => {
    if (!isCog(item)) return item;
    if (!all && i !== scope) {
      if (scope === first && i !== first && !item.styleSource) return copyVisualisation(item, item, 'own');
      return item;
    }
    const { convertToRGB, batchStretch, ...rest } = item as any;
    return {
      ...rest, bands: [styledConfig.bandA, styledConfig.bandB], style: buildIndexStyle(styledConfig), spectralIndex: { ...styledConfig },
      styleSource: all || i === first ? undefined : 'own',
    } as DataSourceItem;
  });
}


export function visualisationName(item: DataSourceItem, bandCount: number, bandLabels?: string[]): string {
  if (item.spectralIndex) {
    return INDEX_RECIPES.find((r) => r.id === item.spectralIndex?.recipe)?.fullName ?? 'Custom index';
  }
  if (item.convertToRGB && item.bands?.length >= 3) {
    const id = matchRecipe(item.bands.slice(0, 3), bandCount, bandLabels);
    return RGB_RECIPES.find((r) => r.id === id)?.name ?? 'Custom';
  }
  return 'No visualisation';
}