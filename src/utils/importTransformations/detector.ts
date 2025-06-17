
import { DetectedTransformations } from './types';
import { detectTypeToFormatConversion } from './detection/typeToFormatDetector';
import { detectBaseLayerFormat } from './detection/baseLayerDetector';
import { detectSwipeLayerTransformation } from './detection/swipeLayerDetector';
import { detectCogTransformation } from './detection/cogDetector';
import { detectSingleItemArrayToObject } from './detection/singleItemDetector';

/**
 * Detect all transformations needed for the imported config
 */
export const detectTransformations = (config: any): DetectedTransformations => {
  const detected: DetectedTransformations = {
    singleItemArrayToObject: false,
    configureCogsAsImages: false,
    transformSwipeLayersToData: false,
    baseLayerFormat: false,
    typeToFormatConversion: false
  };
  
  // Check if export metadata exists first
  if (config._exportMeta && Array.isArray(config._exportMeta.transformations)) {
    detected.singleItemArrayToObject = config._exportMeta.transformations.includes('singleItemArrayToObject');
    detected.configureCogsAsImages = config._exportMeta.transformations.includes('configureCogsAsImages');
    detected.transformSwipeLayersToData = config._exportMeta.transformations.includes('transformSwipeLayersToData');
    detected.baseLayerFormat = config._exportMeta.transformations.includes('baseLayerFormat');
    detected.typeToFormatConversion = config._exportMeta.transformations.includes('typeToFormatConversion');
    return detected;
  }
  
  // Fallback: detect by analyzing the data structure
  detected.typeToFormatConversion = detectTypeToFormatConversion(config);
  detected.baseLayerFormat = detectBaseLayerFormat(config);
  detected.transformSwipeLayersToData = detectSwipeLayerTransformation(config);
  detected.configureCogsAsImages = detectCogTransformation(config);
  detected.singleItemArrayToObject = detectSingleItemArrayToObject(config);
  
  return detected;
};
