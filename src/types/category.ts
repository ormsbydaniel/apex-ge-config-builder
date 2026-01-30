/**
 * Category, Colormap, and Field type definitions
 */

export interface Category {
  color: string;
  label: string;
  value: number;
}

export interface Colormap {
  min: number;
  max: number;
  steps: number;
  name: string;
  reverse: boolean;
}

/**
 * Configuration for how a vector field should be displayed.
 * All properties are optional - only specify what you need.
 */
export interface FieldConfig {
  label?: string;      // Display name for the field
  prefix?: string;     // Text before value (e.g., "approx.")
  suffix?: string;     // Text after value (e.g., "km2")
  precision?: number;  // Decimal places for numeric values (integer)
  order?: number;      // Display order (integer)
  type?: string;       // Special field type (e.g., "date")
  format?: string;     // Format string for special types (e.g., "yyyy-MM-dd")
  [key: string]: unknown; // Allow additional properties for future extensibility
}

/**
 * Fields configuration mapping field names to their display config or null (to hide).
 * Example:
 * {
 *   "springs_tide_range": { "label": "Springs Tide Range", "suffix": "km2", "precision": 3 },
 *   "id": null  // Hidden field
 * }
 */
export type FieldsConfig = Record<string, FieldConfig | null>;
