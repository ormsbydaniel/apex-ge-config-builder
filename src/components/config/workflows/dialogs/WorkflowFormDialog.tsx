import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowItem } from '@/types/dataSource';
import { Service } from '@/types/config';

interface WorkflowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: WorkflowItem | null;
  /** Optional seed values used only when creating a new workflow (initial is null). */
  prefill?: Partial<WorkflowItem> | null;
  services: Service[];
  onSave: (workflow: WorkflowItem) => void;
}

const blank = (): WorkflowItem => ({
  serviceId: '',
  serviceProvider: '',
});

export const WorkflowFormDialog = ({
  open,
  onOpenChange,
  title,
  initial,
  prefill,
  services,
  onSave,
}: WorkflowFormDialogProps) => {
  const [serviceId, setServiceId] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [namespace, setNamespace] = useState('');
  const [application, setApplication] = useState('');

  const isNew = !initial;

  // Initialize state inside useEffect watching open (Core memory)
  useEffect(() => {
    if (!open) return;
    const src: Partial<WorkflowItem> = initial ?? prefill ?? blank();
    setServiceId(src.serviceId ?? '');
    setServiceProvider(src.serviceProvider ?? '');
    setEndpoint(src.serviceDetails?.endpoint ?? '');
    setNamespace(src.serviceDetails?.namespace ?? '');
    setApplication(src.serviceDetails?.application ?? '');
  }, [open, initial, prefill]);

  const providers = Array.from(
    new Set(services.map((s) => (s as any).provider).filter(Boolean) as string[])
  );

  const handleSave = () => {
    if (!serviceId.trim()) return;

    // Build single merged workflow (Core memory: single dispatch)
    const next: WorkflowItem = {
      ...(initial ?? {}),
      serviceId: serviceId.trim(),
      serviceProvider: serviceProvider.trim(),
    };

    if (endpoint.trim() || namespace.trim() || application.trim()) {
      next.serviceDetails = {
        endpoint: endpoint.trim(),
        ...(namespace.trim() && { namespace: namespace.trim() }),
        ...(application.trim() && { application: application.trim() }),
      };
    } else {
      delete (next as any).serviceDetails;
    }

    // Seed an empty attribution skeleton for new workflows so inline editors render placeholders.
    const baseMeta: any = { ...(initial?.meta ?? {}) };
    if (isNew && !baseMeta.attribution) {
      baseMeta.attribution = { text: '' };
    }
    if (Object.keys(baseMeta).length > 0) {
      next.meta = baseMeta;
    } else {
      delete (next as any).meta;
    }

    // Seed layout skeleton for new workflows so layerCard.* sections render.
    if (isNew && !(next as any).layout) {
      (next as any).layout = { layerCard: {} };
    }

    onSave(next);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isNew
              ? 'Review and adjust the workflow details before saving.'
              : 'Edit the workflow configuration.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wf-service-id">Service ID *</Label>
            <Input
              id="wf-service-id"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="e.g. eurac_pv_farm_detection"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wf-provider">Service provider</Label>
            {providers.length > 0 ? (
              <Select
                value={providers.includes(serviceProvider) ? serviceProvider : '__free__'}
                onValueChange={(v) => {
                  if (v !== '__free__') setServiceProvider(v);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  <SelectItem value="__free__">Other / custom…</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <Input
              value={serviceProvider}
              onChange={(e) => setServiceProvider(e.target.value)}
              placeholder="e.g. vito"
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="text-sm font-medium text-foreground">
              Additional service details - EO Application Packages
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-endpoint">Endpoint</Label>
              <Input
                id="wf-endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-namespace">Namespace</Label>
              <Input
                id="wf-namespace"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-application">Application</Label>
              <Input
                id="wf-application"
                value={application}
                onChange={(e) => setApplication(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!serviceId.trim()}>Save workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowFormDialog;
