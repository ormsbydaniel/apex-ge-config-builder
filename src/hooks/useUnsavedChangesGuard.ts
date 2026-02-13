import { useState, useCallback } from 'react';
import { useConfig } from '@/contexts/ConfigContext';

export function useUnsavedChangesGuard() {
  const { config } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const guardAction = useCallback((action: () => void) => {
    if (config.isDirty) {
      setPendingAction(() => action);
      setIsOpen(true);
    } else {
      action();
    }
  }, [config.isDirty]);

  const onConfirm = useCallback(() => {
    setIsOpen(false);
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const onCancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return { guardAction, isOpen, onConfirm, onCancel };
}
