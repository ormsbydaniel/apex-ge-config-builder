/**
 * Category and Colormap type definitions
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
