
import { LayerTypeOption } from '@/hooks/useLayerTypeManagement';

export type PositionValue = 'left' | 'right' | 'background' | 'spotlight';

export interface PositionConfig {
  layerType: LayerTypeOption;
  validPositions: PositionValue[];
  defaultPosition: PositionValue;
}

export const POSITION_CONFIGS: Record<LayerTypeOption, PositionConfig | null> = {
  standard: null, // No position for standard layers
  swipe: {
    layerType: 'swipe',
    validPositions: ['left', 'right'],
    defaultPosition: 'left'
  },
  mirror: {
    layerType: 'mirror',
    validPositions: ['left', 'right'],
    defaultPosition: 'left'
  },
  spotlight: {
    layerType: 'spotlight',
    validPositions: ['background', 'spotlight'],
    defaultPosition: 'background'
  }
};

export const getValidPositions = (layerType: LayerTypeOption): PositionValue[] => {
  const config = POSITION_CONFIGS[layerType];
  return config ? config.validPositions : [];
};

export const getDefaultPosition = (layerType: LayerTypeOption): PositionValue | undefined => {
  const config = POSITION_CONFIGS[layerType];
  return config ? config.defaultPosition : undefined;
};

export const isValidPosition = (layerType: LayerTypeOption, position: PositionValue): boolean => {
  const validPositions = getValidPositions(layerType);
  return validPositions.includes(position);
};

export const getPositionDisplayName = (position: PositionValue): string => {
  const displayNames: Record<PositionValue, string> = {
    left: 'Left',
    right: 'Right',
    background: 'Background',
    spotlight: 'Spotlight'
  };
  return displayNames[position] || position;
};

export const requiresPosition = (layerType: LayerTypeOption): boolean => {
  return POSITION_CONFIGS[layerType] !== null;
};
