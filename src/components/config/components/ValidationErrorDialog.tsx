import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Trash2, Wand2 } from 'lucide-react';
import ValidationErrorDetailsComponent from '../../ValidationErrorDetails';
import { ValidationErrorDetails } from '@/types/config';
import { useConfigImport } from '@/hooks/useConfigImport';
import type { LoadedConfigSource } from '@/contexts/ConfigContext';
import { allErrorsAreSourceScoped, removeInvalidSources } from '@/utils/configRecovery/removeInvalidSources';
import { autoFixConfig } from '@/utils/configRecovery/autoFix';
import { useToast } from '@/hooks/use-toast';

interface ValidationErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationErrorDetails[];
  jsonError?: any;
  fileName?: string;
  /** Parsed JSON of the failing config — required to enable recovery actions. */
  rawConfig?: any;
  /** Source metadata so a retry can re-dispatch with the same provenance. */
  sourceLabel?: string;
  loadedSource?: LoadedConfigSource;
  /** Called after a successful retry so the host can refresh its state. */
  onRetryResult?: (success: boolean, remainingErrors?: ValidationErrorDetails[]) => void;
  /** Allows the dialog to overwrite the displayed errors after a partial fix. */
  onErrorsChange?: (errors: ValidationErrorDetails[]) => void;
}

const ValidationErrorDialog = ({
  open,
  onOpenChange,
  errors,
  jsonError,
  fileName = 'configuration.json',
  rawConfig,
  sourceLabel,
  loadedSource,
  onRetryResult,
  onErrorsChange,
}: ValidationErrorDialogProps) => {
  const { runImportFromObject } = useConfigImport();
  const { toast } = useToast();
  const [busy, setBusy] = useState<null | 'remove' | 'fix'>(null);

  const canRecover = !!rawConfig && !!sourceLabel && !!loadedSource && errors.length > 0;
  const canRemove = canRecover && allErrorsAreSourceScoped(errors);

  const removeTooltip = useMemo(() => {
    if (!canRecover) return 'Recovery unavailable for this error.';
    if (!canRemove) return 'Removal is only available when every error is scoped to a data source.';
    return '';
  }, [canRecover, canRemove]);

  const handleRemove = async () => {
    if (!canRemove || !rawConfig || !sourceLabel || !loadedSource) return;
    setBusy('remove');
    const { config: trimmed, removed } = removeInvalidSources(rawConfig, errors);
    const result = await runImportFromObject(trimmed, sourceLabel, loadedSource, {});
    setBusy(null);
    if (result.success) {
      toast({
        title: 'Loaded with removals',
        description: `Removed ${removed.length} invalid source${removed.length === 1 ? '' : 's'}: ${removed.map((r) => `"${r.name}"`).join(', ')}`,
      });
      onRetryResult?.(true);
      onOpenChange(false);
    } else if (result.errors) {
      onErrorsChange?.(result.errors);
      onRetryResult?.(false, result.errors);
    }
  };

  const handleFix = async () => {
    if (!canRecover || !rawConfig || !sourceLabel || !loadedSource) return;
    setBusy('fix');
    const { config: fixed, appliedFixes } = autoFixConfig(rawConfig, errors);
    console.log('[autoFix] applied fixes:', appliedFixes);
    console.log('[autoFix] flagged source indices:', errors.map(e => e.path).filter(p => p?.[0] === 'sources'));
    if (appliedFixes.length === 0) {
      setBusy(null);
      toast({
        title: 'No automatic fixes available',
        description: 'The errors do not match any known repair pattern. Try removing the invalid sources instead.',
        variant: 'destructive',
      });
      return;
    }
    const result = await runImportFromObject(fixed, sourceLabel, loadedSource, {});
    setBusy(null);
    if (result.success) {
      toast({
        title: 'Auto-repaired and loaded',
        description: `Applied ${appliedFixes.length} fix${appliedFixes.length === 1 ? '' : 'es'}.`,
      });
      onRetryResult?.(true);
      onOpenChange(false);
    } else if (result.errors) {
      console.log('[autoFix] remaining errors after fix:', result.errors);
      toast({
        title: 'Some errors remain',
        description: `Applied ${appliedFixes.length} fix${appliedFixes.length === 1 ? '' : 'es'}, but ${result.errors.length} error${result.errors.length === 1 ? '' : 's'} still need attention. See console for details.`,
        variant: 'destructive',
      });
      onErrorsChange?.(result.errors);
      onRetryResult?.(false, result.errors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Configuration Validation Errors
          </DialogTitle>
          <DialogDescription>
            The configuration could not be loaded. Review the errors below, or use a recovery action to load a partial config.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ValidationErrorDetailsComponent
            errors={errors}
            fileName={fileName}
            jsonError={jsonError}
          />
        </div>
        {canRecover && (
          <DialogFooter className="mt-4 gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!busy}>
              Close
            </Button>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={handleRemove}
                        disabled={!canRemove || !!busy}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {busy === 'remove' ? 'Removing…' : 'Remove invalid sources & load'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {removeTooltip && <TooltipContent>{removeTooltip}</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
              <Button onClick={handleFix} disabled={!!busy}>
                <Wand2 className="h-4 w-4 mr-2" />
                {busy === 'fix' ? 'Repairing…' : 'Try to fix it & reload'}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ValidationErrorDialog;
