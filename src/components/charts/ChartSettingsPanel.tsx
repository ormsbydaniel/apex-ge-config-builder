import React from 'react';
import { ChartConfig, ChartAxis, ChartFont, ChartLegend, ChartLayout, ChartAxisTitle } from '@/types/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChartSettingsPanelProps {
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
}

export function ChartSettingsPanel({ config, onChange }: ChartSettingsPanelProps) {
  const updateLayout = (updates: Partial<ChartLayout>) => {
    onChange({ ...config, layout: { ...config.layout, ...updates } });
  };
  const updateXAxis = (updates: Partial<ChartAxis>) => {
    updateLayout({ xaxis: { ...config.layout?.xaxis, ...updates } });
  };
  const updateYAxis = (updates: Partial<ChartAxis>) => {
    updateLayout({ yaxis: { ...config.layout?.yaxis, ...updates } });
  };
  const updateXAxisTitle = (updates: Partial<ChartAxisTitle>) => {
    updateXAxis({ title: { ...config.layout?.xaxis?.title, ...updates } });
  };
  const updateYAxisTitle = (updates: Partial<ChartAxisTitle>) => {
    updateYAxis({ title: { ...config.layout?.yaxis?.title, ...updates } });
  };
  const updateXAxisTitleFont = (updates: Partial<ChartFont>) => {
    updateXAxisTitle({ font: { ...config.layout?.xaxis?.title?.font, ...updates } });
  };
  const updateYAxisTitleFont = (updates: Partial<ChartFont>) => {
    updateYAxisTitle({ font: { ...config.layout?.yaxis?.title?.font, ...updates } });
  };
  const updateXAxisTickFont = (updates: Partial<ChartFont>) => {
    updateXAxis({ tickfont: { ...config.layout?.xaxis?.tickfont, ...updates } });
  };
  const updateYAxisTickFont = (updates: Partial<ChartFont>) => {
    updateYAxis({ tickfont: { ...config.layout?.yaxis?.tickfont, ...updates } });
  };
  const updateLegend = (updates: Partial<ChartLegend>) => {
    updateLayout({ legend: { ...config.layout?.legend, ...updates } });
  };

  const xType = config.layout?.xaxis?.type || '-';
  const yType = config.layout?.yaxis?.type || '-';

  const ROW_LABEL = "text-xs text-muted-foreground w-12 shrink-0";
  const FIELD_LABEL = "text-xs text-muted-foreground";

  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 pt-2">
      {/* X-Axis */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">X-Axis</Label>

        {/* Type row */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Type</span>
          <Select value={xType} onValueChange={(value) => updateXAxis({ type: value as ChartAxis['type'] })}>
            <SelectTrigger className="h-6 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="-" className="text-xs">Auto</SelectItem>
              <SelectItem value="date" className="text-xs">Date</SelectItem>
              <SelectItem value="linear" className="text-xs">Linear</SelectItem>
              <SelectItem value="category" className="text-xs">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Axis row */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Axis</span>
          <Label className={FIELD_LABEL}>Label:</Label>
          <Input value={config.layout?.xaxis?.title?.text || ''} onChange={(e) => updateXAxisTitle({ text: e.target.value })} className="h-6 text-xs flex-1" />
          <Label className={FIELD_LABEL}>Size:</Label>
          <Input type="number" value={config.layout?.xaxis?.title?.font?.size ?? 10} onChange={(e) => updateXAxisTitleFont({ size: Number(e.target.value) })} min={6} max={24} className="h-6 text-xs w-14" />
        </div>

        {/* Ticks line 1: Format + Suffix */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Ticks</span>
          <Label className={FIELD_LABEL}>Format:</Label>
          <Select value={config.layout?.xaxis?.tickformat || 'auto'} onValueChange={(value) => updateXAxis({ tickformat: value === 'auto' ? undefined : value })}>
            <SelectTrigger className="h-6 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
              {xType === 'date' ? (
                <>
                  <SelectItem value="%b %d" className="text-xs">Jan 15</SelectItem>
                  <SelectItem value="%b %Y" className="text-xs">Jan 2024</SelectItem>
                  <SelectItem value="%Y-%m-%d" className="text-xs">2024-01-15</SelectItem>
                  <SelectItem value="%d/%m/%y" className="text-xs">15/01/24</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value=",.0f" className="text-xs">1,234</SelectItem>
                  <SelectItem value=".2f" className="text-xs">1234.56</SelectItem>
                  <SelectItem value=".0%" className="text-xs">12%</SelectItem>
                  <Label className={FIELD_LABEL}>Suffix:</Label>
                  <Input value={config.layout?.xaxis?.ticksuffix || ''} onChange={(e) => updateXAxis({ ticksuffix: e.target.value || undefined })} className="h-6 text-xs w-20" />
                </>
              )}
            </SelectContent>
          </Select>
          <Label className={FIELD_LABEL}>Suffix:</Label>
          <Input value={config.layout?.xaxis?.ticksuffix || ''} onChange={(e) => updateXAxis({ ticksuffix: e.target.value || undefined })} className="h-6 text-xs w-20" />
        </div>

        {/* Ticks line 2: Size + Orientation */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL} aria-hidden />
          <Label className={FIELD_LABEL}>Size:</Label>
          <Input type="number" value={config.layout?.xaxis?.tickfont?.size ?? 10} onChange={(e) => updateXAxisTickFont({ size: Number(e.target.value) })} min={6} max={18} className="h-6 text-xs w-14" />
          <Label className={FIELD_LABEL}>Orientation:</Label>
          <Slider value={[config.layout?.xaxis?.tickangle || 0]} onValueChange={([value]) => updateXAxis({ tickangle: value })} min={-90} max={0} step={15} className="flex-1" />
          <span className="text-xs text-muted-foreground w-8 text-right">{config.layout?.xaxis?.tickangle || 0}°</span>
        </div>

        {/* Grid row */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Grid</span>
          <Switch checked={config.layout?.xaxis?.showgrid !== false} onCheckedChange={(checked) => updateXAxis({ showgrid: checked })} className="scale-75" />
        </div>
      </div>

      <div className="w-px bg-border" />

      {/* Y-Axis */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Y-Axis</Label>

        {/* Axis row */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Axis</span>
          <Label className={FIELD_LABEL}>Label:</Label>
          <Input value={config.layout?.yaxis?.title?.text || ''} onChange={(e) => updateYAxisTitle({ text: e.target.value })} className="h-6 text-xs flex-1" />
          <Label className={FIELD_LABEL}>Size:</Label>
          <Input type="number" value={config.layout?.yaxis?.title?.font?.size ?? 10} onChange={(e) => updateYAxisTitleFont({ size: Number(e.target.value) })} min={6} max={24} className="h-6 text-xs w-14" />
        </div>

        {/* Ticks line 1: Format + Suffix */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Ticks</span>
          <Label className={FIELD_LABEL}>Format:</Label>
          <Select value={config.layout?.yaxis?.tickformat || 'auto'} onValueChange={(value) => updateYAxis({ tickformat: value === 'auto' ? undefined : value })}>
            <SelectTrigger className="h-6 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
              <SelectItem value=",.0f" className="text-xs">1,234</SelectItem>
              <SelectItem value=".2f" className="text-xs">1234.56</SelectItem>
              <SelectItem value=".0%" className="text-xs">12%</SelectItem>
              <SelectItem value=".1s" className="text-xs">1.2k</SelectItem>
            </SelectContent>
          </Select>
          <Label className={FIELD_LABEL}>Suffix:</Label>
          <Input value={config.layout?.yaxis?.ticksuffix || ''} onChange={(e) => updateYAxis({ ticksuffix: e.target.value || undefined })} className="h-6 text-xs w-20" />
        </div>

        {/* Ticks line 2: Size */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL} aria-hidden />
          <Label className={FIELD_LABEL}>Size:</Label>
          <Input type="number" value={config.layout?.yaxis?.tickfont?.size ?? 10} onChange={(e) => updateYAxisTickFont({ size: Number(e.target.value) })} min={6} max={18} className="h-6 text-xs w-14" />
        </div>

        {/* Grid row */}
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>Grid</span>
          <Switch checked={config.layout?.yaxis?.showgrid !== false} onCheckedChange={(checked) => updateYAxis({ showgrid: checked })} className="scale-75" />
        </div>
      </div>

      <div className="w-px bg-border" />

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">Legend</Label>
          <Switch checked={config.layout?.showlegend !== false} onCheckedChange={(checked) => updateLayout({ showlegend: checked })} className="scale-75" />
        </div>
        {config.layout?.showlegend !== false && (
          <>
            <div className="flex items-center gap-2">
              <Select value={config.layout?.legend?.orientation || 'h'} onValueChange={(value) => updateLegend({ orientation: value as 'h' | 'v' })}>
                <SelectTrigger className="h-6 text-xs flex-1"><span className="text-muted-foreground mr-1">Layout:</span><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h" className="text-xs">Horizontal</SelectItem>
                  <SelectItem value="v" className="text-xs">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={`${config.layout?.legend?.yanchor || 'top'}-${config.layout?.legend?.xanchor || 'left'}`}
                onValueChange={(value) => {
                  const [yanchor, xanchor] = value.split('-') as ['top' | 'middle' | 'bottom', 'left' | 'center' | 'right'];
                  const y = yanchor === 'top' ? 1 : yanchor === 'middle' ? 0.5 : 0;
                  const x = xanchor === 'left' ? 0 : xanchor === 'center' ? 0.5 : 1;
                  updateLegend({ yanchor, xanchor, y, x });
                }}
              >
                <SelectTrigger className="h-6 text-xs flex-1"><span className="text-muted-foreground mr-1">Position:</span><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left" className="text-xs">Top Left</SelectItem>
                  <SelectItem value="top-center" className="text-xs">Top Center</SelectItem>
                  <SelectItem value="top-right" className="text-xs">Top Right</SelectItem>
                  <SelectItem value="bottom-left" className="text-xs">Bottom Left</SelectItem>
                  <SelectItem value="bottom-center" className="text-xs">Bottom Center</SelectItem>
                  <SelectItem value="bottom-right" className="text-xs">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
