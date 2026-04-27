/**
 * Chart type definitions for Plotly-based chart configurations
 * Note: Index signatures are added for Zod passthrough compatibility
 */

// Chart data source - can be external URL, field lookup, COG pixel values, or inline (vector fields)
export interface ChartSource {
  type?: 'externalURL' | 'lookupURL' | 'pixelValues' | 'inline';
  url?: string;      // For externalURL type
  field?: string;    // For lookupURL type
  fields?: string[]; // For inline type — vector dataset properties to chart
  format?: 'csv' | 'json';
  label?: string;
  [key: string]: unknown;
}

// Trace line styling
export interface TraceLine {
  color?: string;
  width?: number;
  dash?: string;
  shape?: string;
  [key: string]: unknown;
}

// Trace marker styling  
export interface TraceMarker {
  size?: number;
  color?: string;
  symbol?: string;
  [key: string]: unknown;
}

// Bar chart options
export interface TraceBar {
  orientation?: 'v' | 'h';
  width?: number;
  [key: string]: unknown;
}

// Histogram options
export interface TraceHistogram {
  nbinsx?: number;
  histnorm?: string;
  [key: string]: unknown;
}

// Individual trace configuration
export interface ChartTrace {
  y?: string;  // Optional due to Zod passthrough behavior
  name?: string;
  type?: 'scatter' | 'bar' | 'histogram' | 'pie';
  mode?: 'lines' | 'markers' | 'lines+markers';
  fill?: 'none' | 'tozeroy' | 'tonexty';
  fillcolor?: string;
  line?: TraceLine;
  marker?: TraceMarker;
  bar?: TraceBar;
  histogram?: TraceHistogram;
  showlegend?: boolean;
  [key: string]: unknown;
}

// Font styling
export interface ChartFont {
  size?: number;
  color?: string;
  family?: string;
  [key: string]: unknown;
}

// Axis title (Plotly v2 native shape: { text, font })
export interface ChartAxisTitle {
  text?: string;
  font?: ChartFont;
  [key: string]: unknown;
}

// Axis configuration
export interface ChartAxis {
  title?: ChartAxisTitle;
  tickfont?: ChartFont;
  tickformat?: string;
  ticksuffix?: string;
  tickprefix?: string;
  type?: 'date' | 'linear' | 'category' | '-';
  tickangle?: number;
  showgrid?: boolean;
  range?: any[];  // Use any[] for flexibility with Zod passthrough
  [key: string]: unknown;
}

// Chart legend configuration
export interface ChartLegend {
  x?: number;
  y?: number;
  xanchor?: string;
  yanchor?: string;
  orientation?: 'h' | 'v';
  [key: string]: unknown;
}

// Chart layout options
export interface ChartLayout {
  height?: number;
  showlegend?: boolean;
  legend?: ChartLegend;
  barmode?: 'group' | 'stack' | 'overlay' | 'relative';
  xaxis?: ChartAxis;
  yaxis?: ChartAxis;
  [key: string]: unknown;
}

// Pie chart specific config
export interface ChartPie {
  labels?: string;  // Optional due to Zod passthrough behavior
  values?: string;  // Optional due to Zod passthrough behavior
  hole?: number;
  textinfo?: string;
  colors?: string[];
  [key: string]: unknown;
}

// Main chart configuration interface
export interface ChartConfig {
  chartType?: 'xy' | 'pie';
  title?: string;
  subtitle?: string;
  x?: string | string[];  // String for field name, array for band labels (pixelValues)
  traces?: ChartTrace[];  // Optional for pie charts
  layout?: ChartLayout;
  pie?: ChartPie;
  sources?: ChartSource[];
  [key: string]: unknown;
}
