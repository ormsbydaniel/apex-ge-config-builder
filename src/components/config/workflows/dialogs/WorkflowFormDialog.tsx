import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
  /** Catalogue-derived metadata. When present, dialog renders in read-only review mode. */
  cataloguePrefill?: { description?: string; provider?: string } | null;
  services: Service[];
  onSave: (workflow: WorkflowItem) => void;
}

const blank = (): WorkflowItem => ({
  serviceId: '',
  serviceProvider: '',
});

const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground">{label}</Label>
    <div className="text-sm break-all">{value || <span className="text-muted-foreground italic">—</span>}</div>
  </div>
);

const ReadOnlyInline = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="break-all">{value || <span className="text-muted-foreground italic">—</span>}</span>
  </div>
);

export const WorkflowFormDialog = ({
  open,
  onOpenChange,
  title,
  initial,
  prefill,
  cataloguePrefill,
  services,
  onSave,
}: WorkflowFormDialogProps) => {
  const [serviceId, setServiceId] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [namespace, setNamespace] = useState('');
  const [application, setApplication] = useState('');
  const [copyDescription, setCopyDescription] = useState(true);
  const [copyAttribution, setCopyAttribution] = useState(true);

  const isNew = !initial;
  const reviewMode = isNew && !!cataloguePrefill;
  const hasDescription = !!cataloguePrefill?.description;
  const hasProvider = !!cataloguePrefill?.provider;

  // Initialize state inside useEffect watching open (Core memory)
  useEffect(() => {
    if (!open) return;
    const src: Partial<WorkflowItem> = initial ?? prefill ?? blank();
    setServiceId(src.serviceId ?? '');
    setServiceProvider(src.serviceProvider ?? '');
    setEndpoint(src.serviceDetails?.endpoint ?? '');
    setNamespace(src.serviceDetails?.namespace ?? '');
    setApplication(src.serviceDetails?.application ?? '');
    setCopyDescription(!!cataloguePrefill?.description);
    setCopyAttribution(!!cataloguePrefill?.provider);
  }, [open, initial, prefill, cataloguePrefill]);

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

    // Apply catalogue copy choices in review mode (merged into single dispatch).
    if (reviewMode) {
      if (copyDescription && cataloguePrefill?.description) {
        baseMeta.description = cataloguePrefill.description;
      }
      if (copyAttribution && cataloguePrefill?.provider) {
        baseMeta.attribution = {
          ...(baseMeta.attribution ?? {}),
          text: cataloguePrefill.provider,
        };
      }
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
            {reviewMode
              ? 'Review the catalogue details below and choose which metadata to copy into the workflow.'
              : isNew
              ? 'Review and adjust the workflow details before saving.'
              : 'Edit the workflow configuration.'}
          </DialogDescription>
        </DialogHeader>

        {reviewMode ? (
          <div className="space-y-4">
            <ReadOnlyRow label="Service ID" value={serviceId} />
            <ReadOnlyRow label="Service provider" value={serviceProvider} />

            {(endpoint || namespace || application) && (
              <div className="space-y-3 pt-2 border-t">
                <div className="text-sm font-medium text-foreground">
                  Service details
                </div>
                {endpoint && <ReadOnlyRow label="Endpoint" value={endpoint} />}
                {namespace && <ReadOnlyRow label="Namespace" value={namespace} />}
                {application && <ReadOnlyRow label="Application" value={application} />}
              </div>
            )}

            {hasDescription && (
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-muted-foreground">Description</Label>
                <div className="text-sm whitespace-pre-wrap max-h-40 overflow-auto rounded-md border bg-muted/30 p-2">
                  {cataloguePrefill!.description}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wf-copy-desc"
                  checked={copyDescription}
                  disabled={!hasDescription}
                  onCheckedChange={(v) => setCopyDescription(v === true)}
                />
                <Label htmlFor="wf-copy-desc" className="cursor-pointer">
                  Copy description
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wf-copy-attr"
                  checked={copyAttribution}
                  disabled={!hasProvider}
                  onCheckedChange={(v) => setCopyAttribution(v === true)}
                />
                <Label htmlFor="wf-copy-attr" className="cursor-pointer">
                  Copy attribution{hasProvider ? ` (“${cataloguePrefill!.provider}”)` : ''}
                </Label>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!serviceId.trim()}>
            {reviewMode ? 'Add workflow' : 'Save workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowFormDialog;
