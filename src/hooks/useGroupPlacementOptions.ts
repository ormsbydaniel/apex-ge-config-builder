import { useMemo } from 'react';
import { DataSource } from '@/types/config';

export interface GroupPlacementOption {
  value: string;           // Encoded value: "groupName" or "groupName::subGroupName"
  label: string;           // Display text: "Soils" or "Soils → Greece"
  interfaceGroup: string;  // Original interface group
  subinterfaceGroup?: string; // Optional sub-group
  isSubGroup: boolean;     // Whether this is a sub-group option
}

export interface GroupedPlacementOptions {
  interfaceGroup: string;
  subGroups: GroupPlacementOption[];
}

// Encode group + subgroup into single value
export const encodeGroupPlacement = (group: string, subGroup?: string): string => {
  if (subGroup) {
    return `${group}::${subGroup}`;
  }
  return group;
};

// Decode value back to group + subgroup
export const decodeGroupPlacement = (value: string): { interfaceGroup: string; subinterfaceGroup?: string } => {
  const parts = value.split('::');
  return {
    interfaceGroup: parts[0],
    subinterfaceGroup: parts[1] || undefined
  };
};

/**
 * Computes hierarchical placement options from interface groups and sources.
 * Returns both a flat list and a grouped structure for flexible rendering.
 */
export const useGroupPlacementOptions = (
  interfaceGroups: string[],
  sources: DataSource[]
): { flatOptions: GroupPlacementOption[]; groupedOptions: GroupedPlacementOptions[] } => {
  return useMemo(() => {
    const flatOptions: GroupPlacementOption[] = [];
    const groupedOptions: GroupedPlacementOptions[] = [];
    
    interfaceGroups.forEach(group => {
      // Find all sub-groups for this interface group
      const subGroups = new Set<string>();
      sources.forEach(source => {
        if (source.layout?.interfaceGroup === group && 
            source.layout?.subinterfaceGroup) {
          subGroups.add(source.layout.subinterfaceGroup);
        }
      });
      
      // Add the parent group itself
      flatOptions.push({
        value: group,
        label: group,
        interfaceGroup: group,
        isSubGroup: false
      });
      
      // Create grouped structure
      const groupEntry: GroupedPlacementOptions = {
        interfaceGroup: group,
        subGroups: []
      };
      
      // Add sub-group options
      Array.from(subGroups).sort().forEach(subGroup => {
        const option: GroupPlacementOption = {
          value: `${group}::${subGroup}`,
          label: `${group} → ${subGroup}`,
          interfaceGroup: group,
          subinterfaceGroup: subGroup,
          isSubGroup: true
        };
        flatOptions.push(option);
        groupEntry.subGroups.push(option);
      });
      
      groupedOptions.push(groupEntry);
    });
    
    return { flatOptions, groupedOptions };
  }, [interfaceGroups, sources]);
};
