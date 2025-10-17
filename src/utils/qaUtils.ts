
import { DataSource } from '@/types/config';

export interface QAStats {
  error: number;
  warning: number;
  info: number;
  success: number;
}

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
    
    // Check for legend (in either layerCard or infoPanel)
    const hasLegend = source.layout?.layerCard?.legend?.url || 
                     source.layout?.infoPanel?.legend?.url ||
                     (source.meta?.categories && source.meta.categories.length > 0) ||
                     (source.meta?.startColor && source.meta?.endColor);
    
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
