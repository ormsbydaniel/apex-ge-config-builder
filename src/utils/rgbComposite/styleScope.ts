import type { DataSourceItem } from '@/types/dataSource';
import { copyVisualisation, firstCogIndex, isCog } from './perDataset';
import { matchRecipe, RGB_RECIPES } from './recipes';
import { INDEX_RECIPES } from './indices';

/** Change composite bands without replacing each dataset's existing RGB ranges. */
export function applyCompositeStyle(
  data: DataSourceItem[], scope: number, bands: number[], all: boolean,
  makeStyle: (item: DataSourceItem) => DataSourceItem['style'],
): DataSourceItem[] {
  const first = firstCogIndex(data);
  return data.map((item, i) => {
    if (!isCog(item)) return item;
    if (!all && i !== scope) {
      // A first-dataset-only change must not quietly alter its followers.
      if (scope === first && i !== first && !item.styleSource) {
        return copyVisualisation(item, item, 'own');
      }
      return item;
    }
    const { spectralIndex, batchStretch, ...rest } = item;
    return {
      ...rest, convertToRGB: true, bands: [...bands], style: makeStyle(item),
      styleSource: all && i !== first && item.styleSource !== 'own' ? undefined : i === first ? undefined : 'own',
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