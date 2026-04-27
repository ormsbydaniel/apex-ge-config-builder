import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { ChartConfig } from '@/types/chart';
import { ParsedCSVData } from '@/utils/csvParser';

/**
 * Convert date string from DD-MM-YYYY format to YYYY-MM-DD (ISO format)
 */
function convertToISODate(value: string): string {
  // Check if it's DD-MM-YYYY or DD/MM/YYYY format
  const ddmmyyyyMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return value;
}

interface PlotlyChartViewerProps {
  config: ChartConfig;
  data: ParsedCSVData;
  height?: number;
  /** Optional sample Y-values for pixelValues preview (one value per x label) */
  sampleData?: number[];
}

export function PlotlyChartViewer({ config, data, height = 400, sampleData }: PlotlyChartViewerProps) {
  const isPixelValues = config.sources?.[0]?.type === 'pixelValues';

  const { plotData, layout, isValid, message } = useMemo(() => {
    // Handle pixelValues preview with sampleData
    if (isPixelValues && Array.isArray(config.x) && config.x.length > 0) {
      const xLabels = config.x as string[];
      const yValues = sampleData || xLabels.map(() => 0);

      const plotTraces = (config.traces || []).map((trace, index) => {
        const plotTrace: any = {
          name: trace.name || `Trace ${index + 1}`,
          type: trace.type || 'scatter',
          x: xLabels,
          y: yValues,
          showlegend: trace.showlegend !== false,
        };

        if (trace.mode) plotTrace.mode = trace.mode;
        if (trace.fill && trace.fill !== 'none') {
          plotTrace.fill = trace.fill;
          if (trace.fillcolor) plotTrace.fillcolor = trace.fillcolor;
        }
        if (trace.line) {
          plotTrace.line = { color: trace.line.color, width: trace.line.width, dash: trace.line.dash, shape: trace.line.shape };
        }
        if (trace.marker) {
          plotTrace.marker = { size: trace.marker.size, color: trace.marker.color, symbol: trace.marker.symbol };
        }
        return plotTrace;
      });

      const chartLayout: any = {
        height: config.layout?.height || height,
        showlegend: config.layout?.showlegend !== false,
        margin: { t: 20, r: 30, b: 50, l: 60 },
        xaxis: buildAxis(config.layout?.xaxis, 'Band'),
        yaxis: buildAxis(config.layout?.yaxis, 'Value'),
      };

      if (config.layout?.legend) chartLayout.legend = config.layout.legend;

      return {
        plotData: plotTraces,
        layout: chartLayout,
        isValid: plotTraces.length > 0,
        message: plotTraces.length === 0 ? 'Add at least one trace' : '',
      };
    }

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
        margin: { t: 20, r: 30, b: 30, l: 30 },
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

    const isDateAxis = config.layout?.xaxis?.type === 'date';
    const xData = config.x
      ? (Array.isArray(config.x)
        ? config.x
        : data.data.map(row => {
            const value = row[config.x as string];
            if (isDateAxis && typeof value === 'string') {
              return convertToISODate(value);
            }
            return value;
          }))
      : [];

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
      margin: { t: 20, r: 30, b: 50, l: 60 },
    };

    if (config.layout?.barmode) {
      chartLayout.barmode = config.layout.barmode;
    }

    if (config.layout?.legend) {
      chartLayout.legend = config.layout.legend;
    }

    // X-axis configuration
    const isHistogram = config.traces.some(t => t.type === 'histogram');
    const xDefault = isHistogram
      ? config.traces[0]?.y
      : (typeof config.x === 'string' ? config.x : undefined);
    chartLayout.xaxis = buildAxis(config.layout?.xaxis, xDefault);

    // Y-axis configuration
    chartLayout.yaxis = buildAxis(config.layout?.yaxis, isHistogram ? 'Count' : undefined);

    return { plotData: plotTraces, layout: chartLayout, isValid: true, message: '' };
  }, [config, data, height, sampleData, isPixelValues]);

  if (!isValid) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {(config.title || config.subtitle) && (
        <div className="text-center mb-2">
          {config.title && (
            <div className="text-base font-semibold text-foreground leading-tight">
              {config.title}
            </div>
          )}
          {config.subtitle && (
            <div className="text-sm text-muted-foreground leading-tight">
              {config.subtitle}
            </div>
          )}
        </div>
      )}
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

/**
 * Pass the stored axis config through to Plotly. Stored shape already
 * matches Plotly v2 spec (title is { text, font }). Only normalizes the
 * "auto" type sentinel and applies a default title when none is set.
 */
function buildAxis(axis: ChartConfig['layout']['xaxis'] | undefined, defaultTitle?: string) {
  const out: any = { ...(axis || {}) };
  if (out.type === '-') delete out.type;
  const hasTitleText = out.title && typeof out.title === 'object' && (out.title as any).text;
  if (!hasTitleText && defaultTitle) {
    out.title = { ...(out.title || {}), text: defaultTitle };
  }
  return out;
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
