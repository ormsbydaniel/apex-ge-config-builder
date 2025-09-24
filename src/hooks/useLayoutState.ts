
import { useCallback } from 'react';

interface UseLayoutStateProps {
  dispatch: (action: any) => void;
}

export const useLayoutState = ({ dispatch }: UseLayoutStateProps) => {
  const updateLayout = useCallback((field: string, value: string) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: { field, value } });
  }, [dispatch]);

  const updateInterfaceGroups = useCallback((interfaceGroups: string[]) => {
    dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: interfaceGroups });
  }, [dispatch]);

  const updateMapConstraints = useCallback((constraints: { zoom?: number; center?: [number, number] }) => {
    dispatch({ type: 'UPDATE_MAP_CONSTRAINTS', payload: constraints });
  }, [dispatch]);

  return {
    updateLayout,
    updateInterfaceGroups,
    updateMapConstraints
  };
};
