
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';

export const useExclusivitySets = () => {
  const { config, dispatch } = useConfig();
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
    dispatch({ 
      type: 'UPDATE_EXCLUSIVITY_SETS', 
      payload: config.exclusivitySets.filter((_, i) => i !== index) 
    });
  }, [config.exclusivitySets, dispatch]);

  return {
    newExclusivitySet,
    setNewExclusivitySet,
    addExclusivitySet,
    removeExclusivitySet
  };
};
