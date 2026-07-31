
import { DataSource } from '@/types/config';

export interface QAStats {
  error: number;
  warning: number;
  info: number;
  success: number;
}

/**
 * A layer counts as having a legend when either:
 *  - an explicit legend image URL is configured, or
 *  - the Geospatial Explorer can auto-generate one from the layer's
 *    visualisation settings (categories, colormaps, or a start/end
 *    colour gradient with or without min/max values), or
 *  - a swatch/gradient legend block is configured in the layout.
 */
export const hasEffectiveLegend = (source: DataSource): boolean => {
  const layerCardLegend = source.layout?.layerCard?.legend;
  const infoPanelLegend = source.layout?.infoPanel?.legend;

  if (layerCardLegend?.url || infoPanelLegend?.url) return true;
  if (layerCardLegend?.type === 'swatch' || layerCardLegend?.type === 'gradient') return true;
  if (infoPanelLegend?.type === 'swatch' || infoPanelLegend?.type === 'gradient') return true;

  const meta = source.meta;
  if (meta?.categories && meta.categories.length > 0) return true;
  if (meta?.colormaps && meta.colormaps.length > 0) return true;
  if (meta?.startColor && meta?.endColor) return true;

  return false;
};


export const calculateQAStats = (sources: DataSource[]): QAStats => {
  const stats = { error: 0, warning: 0, info: 0, success: 0 };

  sources.forEach(source => {
    // Exclude base layers from QA stats
    if (source.isBaseLayer) {
      return;
    }
    
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    
    // Check if layer has data or statistics
    const hasData = source.data && source.data.length > 0 && source.data.some(d => d.url);
    const hasStatistics = source.statistics && source.statistics.length > 0 && source.statistics.some(s => s.url);
    const hasAnyContent = hasData || hasStatistics;
    
    // Check for attribution
    const hasAttribution = source.meta?.attribution?.text;
    
    // Check for legend (explicit or auto-generated from visualisation settings)
    const hasLegend = hasEffectiveLegend(source);

    
    // For swipe layers, check if both clipped and base sources exist
    let swipeComplete = true;
    if (isSwipeLayer) {
      const hasClippedSource = source.meta?.swipeConfig?.clippedSourceName;
      const hasBaseSources = source.meta?.swipeConfig?.baseSourceNames && 
                            source.meta.swipeConfig.baseSourceNames.length > 0;
      swipeComplete = hasClippedSource && hasBaseSources;
    }
    
    // Count layers with each specific issue (a layer can have multiple issues)
    let hasIssues = false;
    
    // Red: No data or statistics
    if (!hasAnyContent) {
      stats.error++;
      hasIssues = true;
    }
    
    // Amber: Missing attribution or incomplete swipe configuration
    if (!hasAttribution || (isSwipeLayer && !swipeComplete)) {
      stats.warning++;
      hasIssues = true;
    }
    
    // Blue: Missing legend (only count if layer has content)
    if (hasAnyContent && !hasLegend) {
      stats.info++;
      hasIssues = true;
    }
    
    // Green: All checks passed
    if (!hasIssues) {
      stats.success++;
    }
  });

  return stats;
};
