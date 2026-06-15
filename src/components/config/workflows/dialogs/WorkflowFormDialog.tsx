import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Library } from 'lucide-react';
import { WorkflowItem } from '@/types/dataSource';
import { Service } from '@/types/config';

interface WorkflowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: WorkflowItem | null;
  services: Service[];
  showCatalogueRail?: boolean;
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
  services,
  showCatalogueRail = false,
  onSave,
}: WorkflowFormDialogProps) => {
  const [serviceId, setServiceId] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [namespace, setNamespace] = useState('');
  const [application, setApplication] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Initialize state inside useEffect watching open (Core memory)
  useEffect(() => {
    if (!open) return;
    const src = initial ?? blank();
    setServiceId(src.serviceId ?? '');
    setServiceProvider(src.serviceProvider ?? '');
    setDescription(src.meta?.description ?? '');
    setEndpoint(src.serviceDetails?.endpoint ?? '');
    setNamespace(src.serviceDetails?.namespace ?? '');
    setApplication(src.serviceDetails?.application ?? '');
    setDetailsOpen(Boolean(src.serviceDetails));
  }, [open, initial]);

  const providers = Array.from(
    new Set(services.map((s) => (s as any).provider).filter(Boolean) as string[])
  );

  const handleSave = () => {
    if (!serviceId.trim()) return;

    const isNew = !initial;

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

    // Seed meta with description (and an empty attribution skeleton for new
    // workflows so inline editors render placeholders).
    const baseMeta: any = { ...(initial?.meta ?? {}) };
    if (description.trim()) {
      baseMeta.description = description.trim();
    } else {
      delete baseMeta.description;
    }
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
            Configure a workflow entry. The catalogue browser will be available here in a future release.
          </DialogDescription>
        </DialogHeader>

        <div className={`grid gap-4 ${showCatalogueRail ? 'grid-cols-[220px_1fr]' : 'grid-cols-1'}`}>
          {showCatalogueRail && (
            <aside className="border rounded-md p-3 bg-muted/30 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <Library className="h-6 w-6 mb-2 opacity-60" />
              Catalogue browser coming soon
            </aside>
          )}

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

            <div className="space-y-1.5">
              <Label htmlFor="wf-description">Description</Label>
              <Textarea
                id="wf-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description shown in the workflow list"
              />
            </div>

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="px-1 -ml-1">
                  <ChevronRight className={`h-4 w-4 mr-1 transition-transform ${detailsOpen ? 'rotate-90' : ''}`} />
                  Service details (optional)
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
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
              </CollapsibleContent>
            </Collapsible>
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
