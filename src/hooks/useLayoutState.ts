
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

  return {
    updateLayout,
    updateInterfaceGroups
  };
};
