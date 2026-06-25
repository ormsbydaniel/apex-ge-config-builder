import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppSettings } from '@/hooks/useAppSettings';

interface AppSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppSettingsDialog = ({ open, onOpenChange }: AppSettingsDialogProps) => {
  const { settings, setSetting } = useAppSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Application settings</DialogTitle>
          <DialogDescription>
            These preferences are stored in your browser only and do not affect the exported configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={settings.showDevViewerVersions}
              onCheckedChange={(v) => setSetting('showDevViewerVersions', v === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <div className="text-sm font-medium leading-none">Show dev versions in preview</div>
              <p className="text-xs text-muted-foreground">
                By default the Preview tab only lists official semver viewer releases. Enable this to also list development / candidate bundles.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppSettingsDialog;
