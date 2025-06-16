
import { useState } from 'react';
import { DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { 
  getLayerCountsByGroup, 
  getMigrationOptions, 
  updateSourcesInterfaceGroup,
  removeSourcesByGroup,
  GroupLayerCount,
  MigrationOption
} from '@/utils/interfaceGroupUtils';

export type { GroupLayerCount, MigrationOption };

export const useInterfaceGroupManagement = (
  interfaceGroups: string[],
  sources: DataSource[],
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void
) => {
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const getLayerCounts = () => getLayerCountsByGroup(interfaceGroups, sources);
  const getMigrationOpts = (excludeGroup?: string) => getMigrationOptions(interfaceGroups, excludeGroup);

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
    const updatedSources = removeSourcesByGroup(sources, groupToRemove);

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
    const updatedSources = updateSourcesInterfaceGroup(sources, groupToRemove, destinationGroup);

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
      const updatedSources = updateSourcesInterfaceGroup(sources, oldName, editingValue.trim());

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
    getLayerCountsByGroup: getLayerCounts,
    getMigrationOptions: getMigrationOpts,
    addInterfaceGroup,
    removeInterfaceGroup,
    migrateLayersAndRemoveGroup,
    startRename,
    cancelRename,
    confirmRename
  };
};
