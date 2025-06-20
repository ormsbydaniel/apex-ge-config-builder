
import { detectTypeToFormatConversion } from './detection/typeToFormatDetector';
import { detectSingleItemArrayToObject } from './detection/singleItemDetector';
import { detectBaseLayerFormat } from './detection/baseLayerDetector';
import { detectSwipeLayerTransformation } from './detection/swipeLayerDetector';
import { detectCogTransformation } from './detection/cogDetector';
import { detectExclusivitySetsTransformation } from './detection/exclusivitySetsDetector';
import { detectMetaCompletionNeeded } from './detection/metaCompletionDetector';
import { detectFormatToTypeTransformation } from './detection/formatToTypeDetector';

import { DetectedTransformations } from './types';

export const detectTransformations = (config: any): DetectedTransformations => {
  console.log('Starting transformation detection');
  
  const detectedTransforms = {
    typeToFormatConversion: detectTypeToFormatConversion(config),
    singleItemArrayToObject: detectSingleItemArrayToObject(config),
    baseLayerFormat: detectBaseLayerFormat(config),
    transformSwipeLayersToData: detectSwipeLayerTransformation(config),
    configureCogsAsImages: detectCogTransformation(config),
    exclusivitySetsTransformation: detectExclusivitySetsTransformation(config),
    metaCompletionNeeded: detectMetaCompletionNeeded(config),
    formatToTypeConversion: detectFormatToTypeTransformation(config),
  };
  
  console.log('Detected transformations:', detectedTransforms);
  return detectedTransforms;
};
