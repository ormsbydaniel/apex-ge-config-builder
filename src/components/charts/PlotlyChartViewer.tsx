import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { ChartConfig } from '@/types/chart';
import { ParsedCSVData } from '@/utils/csvParser';

interface PlotlyChartViewerProps {
  config: ChartConfig;
  data: ParsedCSVData;
  height?: number;
}

export function PlotlyChartViewer({ config, data, height = 400 }: PlotlyChartViewerProps) {
  const { plotData, layout, isValid, message } = useMemo(() => {
    // Check if we have valid configuration
    if (!data.columns.length || !data.data.length) {
      return { plotData: [], layout: {}, isValid: false, message: 'No data available' };
    }

    // Handle pie charts
    if (config.chartType === 'pie' && config.pie) {
      const pieConfig = config.pie;
      if (!pieConfig.labels || !pieConfig.values) {
        return { plotData: [], layout: {}, isValid: false, message: 'Configure labels and values for pie chart' };
      }

      const labels = data.data.map(row => row[pieConfig.labels!]);
      const values = data.data.map(row => row[pieConfig.values!]);

      const trace: any = {
        type: 'pie',
        labels,
        values,
        hole: pieConfig.hole || 0,
        textinfo: pieConfig.textinfo || 'percent',
      };

      if (pieConfig.colors) {
        trace.marker = { colors: pieConfig.colors };
      }

      const pieLayout: any = {
        height: config.layout?.height || height,
        showlegend: config.layout?.showlegend !== false,
        title: buildTitle(config.title, config.subtitle),
      };

      if (config.layout?.legend) {
        pieLayout.legend = config.layout.legend;
      }

      return { plotData: [trace], layout: pieLayout, isValid: true, message: '' };
    }

    // Handle XY charts (scatter, bar, histogram)
    if (!config.x && config.traces?.[0]?.type !== 'histogram') {
      return { plotData: [], layout: {}, isValid: false, message: 'Configure X-axis column' };
    }

    if (!config.traces?.length) {
      return { plotData: [], layout: {}, isValid: false, message: 'Add at least one trace' };
    }

    const xData = config.x ? data.data.map(row => row[config.x!]) : [];

    const plotTraces = config.traces.map((trace, index) => {
      const plotTrace: any = {
        name: trace.name || trace.y || `Trace ${index + 1}`,
        showlegend: trace.showlegend !== false,
      };

      // Handle histogram specially - y becomes x for binning
      if (trace.type === 'histogram') {
        plotTrace.type = 'histogram';
        plotTrace.x = trace.y ? data.data.map(row => row[trace.y!]) : [];
        
        if (trace.histogram?.nbinsx) {
          plotTrace.nbinsx = trace.histogram.nbinsx;
        }
        if (trace.histogram?.histnorm) {
          plotTrace.histnorm = trace.histogram.histnorm;
        }
        if (trace.marker?.color) {
          plotTrace.marker = { color: trace.marker.color };
        }
      } else {
        plotTrace.type = trace.type || 'scatter';
        plotTrace.x = xData;
        plotTrace.y = trace.y ? data.data.map(row => row[trace.y!]) : [];

        if (trace.mode) {
          plotTrace.mode = trace.mode;
        }

        if (trace.fill && trace.fill !== 'none') {
          plotTrace.fill = trace.fill;
          if (trace.fillcolor) {
            plotTrace.fillcolor = trace.fillcolor;
          }
        }

        if (trace.line) {
          plotTrace.line = {
            color: trace.line.color,
            width: trace.line.width,
            dash: trace.line.dash,
            shape: trace.line.shape,
          };
        }

        if (trace.marker) {
          plotTrace.marker = {
            size: trace.marker.size,
            color: trace.marker.color,
            symbol: trace.marker.symbol,
          };
        }

        if (trace.bar && trace.type === 'bar') {
          if (trace.bar.orientation) {
            plotTrace.orientation = trace.bar.orientation;
          }
        }
      }

      return plotTrace;
    });

    // Build layout
    const chartLayout: any = {
      height: config.layout?.height || height,
      showlegend: config.layout?.showlegend !== false,
      title: buildTitle(config.title, config.subtitle),
      margin: { t: 50, r: 30, b: 50, l: 60 },
    };

    if (config.layout?.barmode) {
      chartLayout.barmode = config.layout.barmode;
    }

    if (config.layout?.legend) {
      chartLayout.legend = config.layout.legend;
    }

    // X-axis configuration
    const isHistogram = config.traces.some(t => t.type === 'histogram');
    chartLayout.xaxis = {
      title: isHistogram ? config.traces[0]?.y : (config.layout?.xaxis?.title || config.x),
      ...buildAxisConfig(config.layout?.xaxis),
    };

    // Y-axis configuration  
    chartLayout.yaxis = {
      title: isHistogram ? 'Count' : config.layout?.yaxis?.title,
      ...buildAxisConfig(config.layout?.yaxis),
    };

    return { plotData: plotTraces, layout: chartLayout, isValid: true, message: '' };
  }, [config, data, height]);

  if (!isValid) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Plot
        data={plotData}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%' }}
      />
      <div className="text-xs text-muted-foreground text-center mt-2">
        {getChartInfo(config, data)}
      </div>
    </div>
  );
}

function buildTitle(title?: string, subtitle?: string): string | undefined {
  if (!title && !subtitle) return undefined;
  if (!subtitle) return title;
  return `${title}<br><span style="font-size:12px;color:#666">${subtitle}</span>`;
}

function buildAxisConfig(axis?: ChartConfig['layout']['xaxis']) {
  if (!axis) return {};
  
  return {
    type: axis.type === '-' ? undefined : axis.type,
    tickformat: axis.tickformat,
    ticksuffix: axis.ticksuffix,
    tickprefix: axis.tickprefix,
    tickangle: axis.tickangle,
    showgrid: axis.showgrid,
    tickfont: axis.tickfont,
    titlefont: axis.titleFont,
    range: axis.range,
  };
}

function getChartInfo(config: ChartConfig, data: ParsedCSVData): string {
  const chartType = config.chartType === 'pie' 
    ? 'Pie Chart' 
    : config.traces?.some(t => t.type === 'histogram')
      ? 'Histogram'
      : config.traces?.some(t => t.type === 'bar')
        ? 'Bar Chart'
        : config.traces?.some(t => t.fill && t.fill !== 'none')
          ? 'Area Chart'
          : 'Line Chart';

  const traceCount = config.chartType === 'pie' ? 1 : (config.traces?.length || 0);
  const points = data.data.length;

  return `${chartType}: ${traceCount} trace(s), ${points} points`;
}
