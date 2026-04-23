
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/config';

interface UseServiceManagementProps {
  config: { services: Service[] };
  dispatch: (action: any) => void;
}

export const useServiceManagement = ({ config, dispatch }: UseServiceManagementProps) => {
  const { toast } = useToast();

  const addService = useCallback((service: Service) => {
    dispatch({ type: 'ADD_SERVICE', payload: service });
  }, [dispatch]);

  const removeService = useCallback((index: number) => {
    const serviceToRemove = config.services[index];
    dispatch({ type: 'REMOVE_SERVICE', payload: index });

    toast({
      title: "Service Removed",
      description: `"${serviceToRemove.name}" has been removed. Associated sources have been updated.`,
    });
  }, [config.services, dispatch, toast]);

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    dispatch({ type: 'UPDATE_SERVICE', payload: { id, patch } });
    const isUserEdit = 'name' in patch || 'url' in patch;
    if (isUserEdit) {
      toast({
        title: "Service Updated",
        description: `"${patch.name ?? ''}" saved.`,
      });
    }
  }, [dispatch, toast]);

  return {
    addService,
    removeService,
    updateService,
  };
};
