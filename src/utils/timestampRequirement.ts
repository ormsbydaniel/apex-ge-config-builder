/**
 * Whether a data source must carry a manual timestamp before saving.
 * STAC sources take their date from each item's own `datetime`, so a manual
 * timestamp is only an optional override for them.
 */
export function isManualTimestampRequired(opts: {
  requiresTimestamp: boolean;
  format: string;
  useTimeParameter: boolean;
}): boolean {
  const { requiresTimestamp, format, useTimeParameter } = opts;
  if (!requiresTimestamp || format === 'stac') return false;
  const isWmsOrWmts = format === 'wms' || format === 'wmts';
  return !isWmsOrWmts || !useTimeParameter;
}
