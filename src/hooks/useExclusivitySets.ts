
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseExclusivitySetsProps {
  config: { exclusivitySets: string[] };
  dispatch: (action: any) => void;
}

export const useExclusivitySets = ({ config, dispatch }: UseExclusivitySetsProps) => {
  const { toast } = useToast();
  const [newExclusivitySet, setNewExclusivitySet] = useState('');

  const addExclusivitySet = useCallback(() => {
    if (newExclusivitySet.trim()) {
      dispatch({ 
        type: 'UPDATE_EXCLUSIVITY_SETS', 
        payload: [...config.exclusivitySets, newExclusivitySet.trim()] 
      });
      setNewExclusivitySet('');
      toast({
        title: "Exclusivity Set Added",
        description: `"${newExclusivitySet}" has been added to exclusivity sets.`,
      });
    }
  }, [newExclusivitySet, config.exclusivitySets, dispatch, toast]);

  const removeExclusivitySet = useCallback((index: number) => {
    const setToRemove = config.exclusivitySets[index];
    dispatch({ 
      type: 'REMOVE_EXCLUSIVITY_SET', 
      payload: { index, setName: setToRemove }
    });
  }, [config.exclusivitySets, dispatch]);

  return {
    newExclusivitySet,
    setNewExclusivitySet,
    addExclusivitySet,
    removeExclusivitySet
  };
};
