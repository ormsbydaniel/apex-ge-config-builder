
import { useState } from 'react';
import { DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

export interface GroupLayerCount {
  groupName: string;
  layerCount: number;
}

export interface MigrationOption {
  groupName: string;
  isAvailable: boolean;
}

export const useInterfaceGroupManagement = (
  interfaceGroups: string[],
  sources: DataSource[],
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void
) => {
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const getLayerCountsByGroup = (): GroupLayerCount[] => {
    return interfaceGroups.map(groupName => ({
      groupName,
      layerCount: sources.filter(source => source.layout?.interfaceGroup === groupName).length
    }));
  };

  const getMigrationOptions = (excludeGroup?: string): MigrationOption[] => {
    return interfaceGroups
      .filter(group => group !== excludeGroup)
      .map(groupName => ({
        groupName,
        isAvailable: true
      }));
  };

  const addInterfaceGroup = (newGroup: string): boolean => {
    if (newGroup.trim() && !interfaceGroups.includes(newGroup.trim())) {
      updateConfig({
        interfaceGroups: [...interfaceGroups, newGroup.trim()]
      });
      toast({
        title: "Interface Group Added",
        description: `"${newGroup}" has been added to interface groups.`,
      });
      return true;
    }
    return false;
  };

  const removeInterfaceGroup = (index: number): void => {
    const groupToRemove = interfaceGroups[index];
    const updatedGroups = interfaceGroups.filter((_, i) => i !== index);
    
    // Remove all sources that use this interface group
    const updatedSources = sources.filter(source => 
      source.layout?.interfaceGroup !== groupToRemove
    );

    updateConfig({
      interfaceGroups: updatedGroups,
      sources: updatedSources
    });

    toast({
      title: "Interface Group Deleted",
      description: `"${groupToRemove}" and all its layers have been deleted.`,
    });
  };

  const migrateLayersAndRemoveGroup = (groupIndex: number, destinationGroup: string): void => {
    const groupToRemove = interfaceGroups[groupIndex];
    const updatedGroups = interfaceGroups.filter((_, i) => i !== groupIndex);
    
    // Update sources to use the destination group
    const updatedSources = sources.map(source => 
      source.layout?.interfaceGroup === groupToRemove
        ? { ...source, layout: { ...source.layout, interfaceGroup: destinationGroup } }
        : source
    );

    updateConfig({
      interfaceGroups: updatedGroups,
      sources: updatedSources
    });

    toast({
      title: "Interface Group Migrated",
      description: `Layers from "${groupToRemove}" have been moved to "${destinationGroup}".`,
    });
  };

  const startRename = (index: number): void => {
    setEditingIndex(index);
    setEditingValue(interfaceGroups[index]);
  };

  const cancelRename = (): void => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const confirmRename = (): boolean => {
    if (editingIndex !== null && editingValue.trim() && !interfaceGroups.includes(editingValue.trim())) {
      const oldName = interfaceGroups[editingIndex];
      const updatedGroups = interfaceGroups.map((group, i) => 
        i === editingIndex ? editingValue.trim() : group
      );

      // Update sources that use the old interface group name
      const updatedSources = sources.map(source => 
        source.layout?.interfaceGroup === oldName
          ? { ...source, layout: { ...source.layout, interfaceGroup: editingValue.trim() } }
          : source
      );

      updateConfig({
        interfaceGroups: updatedGroups,
        sources: updatedSources
      });

      toast({
        title: "Interface Group Renamed",
        description: `"${oldName}" has been renamed to "${editingValue.trim()}".`,
      });

      setEditingIndex(null);
      setEditingValue('');
      return true;
    }
    return false;
  };

  return {
    editingIndex,
    editingValue,
    setEditingValue,
    getLayerCountsByGroup,
    getMigrationOptions,
    addInterfaceGroup,
    removeInterfaceGroup,
    migrateLayersAndRemoveGroup,
    startRename,
    cancelRename,
    confirmRename
  };
};
