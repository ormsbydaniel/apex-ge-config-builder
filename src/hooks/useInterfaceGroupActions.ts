
interface UseInterfaceGroupActionsProps {
  config: {
    interfaceGroups: string[];
  };
  updateConfig: (updates: { interfaceGroups?: string[] }) => void;
}

export const useInterfaceGroupActions = ({
  config,
  updateConfig
}: UseInterfaceGroupActionsProps) => {
  const handleAddInterfaceGroup = (groupName: string): boolean => {
    if (groupName.trim() && !config.interfaceGroups.includes(groupName.trim())) {
      updateConfig({
        interfaceGroups: [...config.interfaceGroups, groupName.trim()]
      });
      return true;
    }
    return false;
  };

  return {
    handleAddInterfaceGroup
  };
};
