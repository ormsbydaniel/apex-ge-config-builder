
export interface DetectedTransformations {
  singleItemArrayToObject: boolean;
  configureCogsAsImages: boolean;
  transformSwipeLayersToData: boolean;
  baseLayerFormat: boolean;
  typeToFormatConversion: boolean;
  exclusivitySetsTransformation: boolean;
}

export interface TransformationContext {
  config: any;
  enabled: boolean;
}
