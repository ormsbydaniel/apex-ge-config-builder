
import { useCallback } from 'react';
import { DesignConfig } from '@/types/format';

interface UseLayoutStateProps {
  dispatch: (action: any) => void;
}

export const useLayoutState = ({ dispatch }: UseLayoutStateProps) => {
  const updateLayout = useCallback((field: string, value: string) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: { field, value } });
  }, [dispatch]);

  const updateDesign = useCallback((design: DesignConfig | undefined) => {
    dispatch({ type: 'UPDATE_DESIGN', payload: design });
  }, [dispatch]);

  const updateInterfaceGroups = useCallback((interfaceGroups: string[]) => {
    dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: interfaceGroups });
  }, [dispatch]);

  const updateMapConstraints = useCallback((constraints: { zoom?: number; center?: [number, number] }) => {
    dispatch({ type: 'UPDATE_MAP_CONSTRAINTS', payload: constraints });
  }, [dispatch]);

  return {
    updateLayout,
    updateDesign,
    updateInterfaceGroups,
    updateMapConstraints
  };
};
