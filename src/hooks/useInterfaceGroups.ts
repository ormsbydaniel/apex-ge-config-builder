
import { useState } from 'react';
import { DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

export const useInterfaceGroups = (
  interfaceGroups: string[],
  sources: DataSource[],
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void
) => {
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const addInterfaceGroup = (newGroup: string) => {
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

  const removeInterfaceGroup = (index: number) => {
    const groupToRemove = interfaceGroups[index];
    const updatedGroups = interfaceGroups.filter((_, i) => i !== index);
    
    // Update sources that use this interface group to use the first available group or empty string
    const updatedSources = sources.map(source => 
      source.layout?.interfaceGroup === groupToRemove
        ? { ...source, layout: { ...source.layout, interfaceGroup: updatedGroups[0] || '' } }
        : source
    );

    updateConfig({
      interfaceGroups: updatedGroups,
      sources: updatedSources
    });

    toast({
      title: "Interface Group Removed",
      description: `"${groupToRemove}" has been removed. Associated sources have been updated.`,
    });
  };

  const startRename = (index: number) => {
    setEditingIndex(index);
    setEditingValue(interfaceGroups[index]);
  };

  const cancelRename = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const confirmRename = () => {
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
        description: `"${oldName}" has been renamed to "${editingValue.trim()}". Associated sources have been updated.`,
      });

      setEditingIndex(null);
      setEditingValue('');
      return true;
    }
    return false;
  };

  const moveInterfaceGroup = (fromIndex: number, toIndex: number) => {
    const updatedGroups = [...interfaceGroups];
    const [movedItem] = updatedGroups.splice(fromIndex, 1);
    updatedGroups.splice(toIndex, 0, movedItem);

    updateConfig({
      interfaceGroups: updatedGroups
    });

    toast({
      title: "Interface Group Reordered",
      description: "Interface groups have been reordered.",
    });
  };

  return {
    editingIndex,
    editingValue,
    setEditingValue,
    addInterfaceGroup,
    removeInterfaceGroup,
    startRename,
    cancelRename,
    confirmRename,
    moveInterfaceGroup
  };
};
