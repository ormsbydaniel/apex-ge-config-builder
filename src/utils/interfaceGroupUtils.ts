
import { DataSource } from '@/types/config';

export interface GroupLayerCount {
  groupName: string;
  layerCount: number;
}

export interface MigrationOption {
  groupName: string;
  isAvailable: boolean;
}

export const getLayerCountsByGroup = (
  interfaceGroups: string[],
  sources: DataSource[]
): GroupLayerCount[] => {
  return interfaceGroups.map(groupName => ({
    groupName,
    layerCount: sources.filter(source => source.layout?.interfaceGroup === groupName).length
  }));
};

export const getMigrationOptions = (
  interfaceGroups: string[],
  excludeGroup?: string
): MigrationOption[] => {
  return interfaceGroups
    .filter(group => group !== excludeGroup)
    .map(groupName => ({
      groupName,
      isAvailable: true
    }));
};

export const updateSourcesInterfaceGroup = (
  sources: DataSource[],
  oldGroupName: string,
  newGroupName: string
): DataSource[] => {
  return sources.map(source => 
    source.layout?.interfaceGroup === oldGroupName
      ? { ...source, layout: { ...source.layout, interfaceGroup: newGroupName } }
      : source
  );
};

export const removeSourcesByGroup = (
  sources: DataSource[],
  groupName: string
): DataSource[] => {
  return sources.filter(source => source.layout?.interfaceGroup !== groupName);
};
