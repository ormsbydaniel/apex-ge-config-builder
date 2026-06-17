import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Workflow as WorkflowIcon } from 'lucide-react';
import { WorkflowItem } from '@/types/dataSource';
import { Service } from '@/types/config';
import SortableWorkflowCard from './SortableWorkflowCard';
import { WorkflowFormDialog } from './dialogs/WorkflowFormDialog';
import WorkflowJsonEditorDialog from './dialogs/WorkflowJsonEditorDialog';
import CatalogueBrowserDialog from './dialogs/CatalogueBrowserDialog';
import type { MappedWorkflowFields } from '@/lib/catalogue/types';
import { resolveProviderUrl, getCachedEntries } from '@/lib/catalogue/apexCatalogue';

interface WorkflowsTabProps {
  workflows: WorkflowItem[];
  services: Service[];
  addWorkflow: (workflow: WorkflowItem) => void;
  updateWorkflow: (index: number, workflow: WorkflowItem) => void;
  removeWorkflow: (index: number) => void;
  duplicateWorkflow: (index: number) => void;
  moveWorkflow: (fromIndex: number, toIndex: number) => void;
}

export const WorkflowsTab = ({
  workflows,
  services,
  addWorkflow,
  updateWorkflow,
  removeWorkflow,
  duplicateWorkflow,
  moveWorkflow,
}: WorkflowsTabProps) => {
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<WorkflowItem> | null>(null);
  const [cataloguePrefill, setCataloguePrefill] = useState<
    { description?: string; provider?: string; providerUrl?: string } | null
  >(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [jsonIndex, setJsonIndex] = useState<number | null>(null);
  const editing = editIndex !== null ? workflows[editIndex] : null;
  const jsonEditing = jsonIndex !== null ? workflows[jsonIndex] : null;

  const handleCatalogueSelect = async (fields: MappedWorkflowFields) => {
    const seed: Partial<WorkflowItem> = {
      serviceId: fields.serviceId,
      serviceProvider: fields.serviceProvider,
      ...(fields.serviceDetails && { serviceDetails: fields.serviceDetails }),
    };
    setPrefill(seed);
    setCataloguePrefill({
      description: fields.description,
      provider: fields.providerLabel ?? fields.serviceProvider,
    });
    setCatalogueOpen(false);
    setAddOpen(true);

    // Resolve provider attribution URL asynchronously and patch in when available.
    const entry = getCachedEntries()?.find(
      (e) => e.provider === fields.serviceProvider && (e.record.id === fields.serviceId || e.algorithmId === fields.serviceId),
    );
    if (entry) {
      const providerUrl = await resolveProviderUrl(entry);
      if (providerUrl) {
        setCataloguePrefill((prev) =>
          prev ? { ...prev, providerUrl } : { providerUrl },
        );
      }
    }
  };

  const handleSkipCatalogue = () => {
    setPrefill(null);
    setCataloguePrefill(null);
    setCatalogueOpen(false);
    setAddOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = workflows.map((w, i) => `wf-${w.serviceId ?? 'unnamed'}-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    // Use moveWorkflow which expects from/to; arrayMove logic mirrors that.
    void arrayMove;
    moveWorkflow(from, to);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <WorkflowIcon className="h-5 w-5" />
            Algorithms
            <span className="text-sm font-normal text-muted-foreground">
              ({workflows.length})
            </span>
          </CardTitle>
        </div>
        <Button onClick={() => setCatalogueOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Algorithm
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {workflows.length === 0 ? (
          <div className="border border-dashed rounded-md py-10 text-center text-sm text-muted-foreground">
            <WorkflowIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="mb-3">No algorithms yet</p>
            <Button onClick={() => setCatalogueOpen(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Algorithm
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {workflows.map((workflow, index) => (
                <SortableWorkflowCard
                  key={ids[index]}
                  id={ids[index]}
                  workflow={workflow}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === workflows.length - 1}
                  onEdit={() => setEditIndex(index)}
                  onEditJson={() => setJsonIndex(index)}
                  onDuplicate={() => duplicateWorkflow(index)}
                  onRemove={() => removeWorkflow(index)}
                  onMoveUp={() => moveWorkflow(index, index - 1)}
                  onMoveDown={() => moveWorkflow(index, index + 1)}
                  onMoveToTop={() => moveWorkflow(index, 0)}
                  onMoveToBottom={() => moveWorkflow(index, workflows.length - 1)}
                  onUpdate={(wf) => updateWorkflow(index, wf)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <CatalogueBrowserDialog
        open={catalogueOpen}
        onOpenChange={setCatalogueOpen}
        onSelect={handleCatalogueSelect}
        onSkip={handleSkipCatalogue}
      />

      <WorkflowFormDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setPrefill(null);
            setCataloguePrefill(null);
          }
        }}
        title="Review workflow"
        services={services}
        prefill={prefill}
        cataloguePrefill={cataloguePrefill}
        onSave={(wf) => addWorkflow(wf)}
      />



      <WorkflowFormDialog
        open={editIndex !== null}
        onOpenChange={(open) => { if (!open) setEditIndex(null); }}
        title="Edit Workflow"
        initial={editing}
        services={services}
        onSave={(wf) => {
          if (editIndex !== null) updateWorkflow(editIndex, wf);
          setEditIndex(null);
        }}
      />

      {jsonEditing && (
        <WorkflowJsonEditorDialog
          isOpen={jsonIndex !== null}
          onClose={() => setJsonIndex(null)}
          workflow={jsonEditing}
          onSave={(wf) => {
            if (jsonIndex !== null) updateWorkflow(jsonIndex, wf);
            setJsonIndex(null);
          }}
        />
      )}
    </Card>
  );
};

export default WorkflowsTab;
