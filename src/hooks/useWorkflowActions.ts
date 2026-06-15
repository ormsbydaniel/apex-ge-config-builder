import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WorkflowItem } from '@/types/dataSource';

interface UseWorkflowActionsProps {
  config: { workflows?: WorkflowItem[] };
  dispatch: (action: any) => void;
}

/**
 * Top-level workflow CRUD. Each handler dispatches a single UPDATE_WORKFLOWS
 * action carrying the next array (Core memory: merge updates into a single
 * dispatch to prevent race conditions).
 */
export const useWorkflowActions = ({ config, dispatch }: UseWorkflowActionsProps) => {
  const { toast } = useToast();

  const list = (): WorkflowItem[] => config.workflows ?? [];

  const addWorkflow = useCallback((workflow: WorkflowItem) => {
    const next = [...list(), workflow];
    dispatch({ type: 'UPDATE_WORKFLOWS', payload: next });
    toast({
      title: 'Workflow added',
      description: workflow.serviceId || 'New workflow',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workflows, dispatch, toast]);

  const updateWorkflow = useCallback((index: number, workflow: WorkflowItem) => {
    const current = list();
    if (index < 0 || index >= current.length) return;
    const next = current.map((w, i) => (i === index ? workflow : w));
    dispatch({ type: 'UPDATE_WORKFLOWS', payload: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workflows, dispatch]);

  const removeWorkflow = useCallback((index: number) => {
    const current = list();
    if (index < 0 || index >= current.length) return;
    const removed = current[index];
    const next = current.filter((_, i) => i !== index);
    dispatch({ type: 'UPDATE_WORKFLOWS', payload: next });
    toast({
      title: 'Workflow removed',
      description: removed.serviceId || `Workflow ${index + 1}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workflows, dispatch, toast]);

  const duplicateWorkflow = useCallback((index: number) => {
    const current = list();
    if (index < 0 || index >= current.length) return;
    const original = current[index];
    const copy: WorkflowItem = JSON.parse(JSON.stringify(original));
    if (copy.serviceId) copy.serviceId = `${copy.serviceId}_copy`;
    const next = [
      ...current.slice(0, index + 1),
      copy,
      ...current.slice(index + 1),
    ];
    dispatch({ type: 'UPDATE_WORKFLOWS', payload: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workflows, dispatch]);

  const moveWorkflow = useCallback((fromIndex: number, toIndex: number) => {
    const current = list();
    if (
      fromIndex < 0 || fromIndex >= current.length ||
      toIndex < 0 || toIndex >= current.length ||
      fromIndex === toIndex
    ) return;
    const next = [...current];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    dispatch({ type: 'UPDATE_WORKFLOWS', payload: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workflows, dispatch]);

  return {
    workflows: list(),
    addWorkflow,
    updateWorkflow,
    removeWorkflow,
    duplicateWorkflow,
    moveWorkflow,
  };
};
