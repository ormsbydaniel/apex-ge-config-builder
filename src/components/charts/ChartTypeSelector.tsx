import React from 'react';
import { ChartConfig, ChartTrace } from '@/types/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { LineChart, AreaChart, BarChart3, PieChart } from 'lucide-react';
import { hexToRgba, extractHexColor } from '@/utils/colorPalettes';

type ChartDisplayType = 'line' | 'area' | 'bar' | 'histogram' | 'pie';

interface ChartTypeSelectorProps {
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
}

export function ChartTypeSelector({ config, onChange }: ChartTypeSelectorProps) {
  const currentType = getDisplayType(config);

  const handleTypeChange = (newType: ChartDisplayType) => {
    if (!newType || newType === currentType) return;
    
    const updatedConfig = convertChartType(config, newType);
    onChange(updatedConfig);
  };

  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={currentType} 
        onValueChange={(value) => value && handleTypeChange(value as ChartDisplayType)}
        className="justify-start"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="line" aria-label="Line Chart">
              <LineChart className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Line Chart</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="area" aria-label="Area Chart">
              <AreaChart className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Area Chart</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="bar" aria-label="Bar Chart">
              <BarChart3 className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Bar Chart</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="histogram" aria-label="Histogram">
              <BarChart3 className="h-4 w-4 rotate-90" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Histogram</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="pie" aria-label="Pie Chart">
              <PieChart className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Pie / Donut Chart</TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}

function getDisplayType(config: ChartConfig): ChartDisplayType {
  if (config.chartType === 'pie') return 'pie';
  
  const firstTrace = config.traces?.[0];
  if (!firstTrace) return 'line';
  
  if (firstTrace.type === 'bar') return 'bar';
  if (firstTrace.type === 'histogram') return 'histogram';
  if (firstTrace.fill && firstTrace.fill !== 'none') return 'area';
  
  return 'line';
}

function convertChartType(config: ChartConfig, newType: ChartDisplayType): ChartConfig {
  const updatedConfig = { ...config };

  // Converting to pie
  if (newType === 'pie') {
    updatedConfig.chartType = 'pie';
    updatedConfig.pie = {
      labels: config.x || '',
      values: config.traces?.[0]?.y || '',
      hole: 0,
      textinfo: 'percent',
    };
    return updatedConfig;
  }

  // Converting from pie to XY
  if (config.chartType === 'pie') {
    updatedConfig.chartType = 'xy';
    updatedConfig.x = config.pie?.labels || '';
    updatedConfig.traces = [{
      y: config.pie?.values || '',
      name: 'Series 1',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#2563eb', width: 2 },
    }];
    delete updatedConfig.pie;
  }

  // Update traces based on new type
  const traces = (updatedConfig.traces || []).map((trace, index) => {
    const updatedTrace = { ...trace };
    const lineColor = extractHexColor(trace.line?.color, '#2563eb');

    switch (newType) {
      case 'line':
        updatedTrace.type = 'scatter';
        updatedTrace.mode = 'lines';
        updatedTrace.fill = 'none';
        delete updatedTrace.fillcolor;
        break;

      case 'area':
        updatedTrace.type = 'scatter';
        updatedTrace.mode = 'lines';
        updatedTrace.fill = 'tozeroy';
        updatedTrace.fillcolor = hexToRgba(lineColor, 0.3);
        break;

      case 'bar':
        updatedTrace.type = 'bar';
        delete updatedTrace.mode;
        delete updatedTrace.fill;
        delete updatedTrace.fillcolor;
        break;

      case 'histogram':
        updatedTrace.type = 'histogram';
        delete updatedTrace.mode;
        delete updatedTrace.fill;
        delete updatedTrace.fillcolor;
        break;
    }

    return updatedTrace;
  });

  // For histogram, keep only the first trace
  if (newType === 'histogram' && traces.length > 1) {
    updatedConfig.traces = [traces[0]];
  } else {
    updatedConfig.traces = traces;
  }

  // Set barmode for bar charts
  if (newType === 'bar') {
    updatedConfig.layout = {
      ...updatedConfig.layout,
      barmode: 'group',
    };
  }

  return updatedConfig;
}
