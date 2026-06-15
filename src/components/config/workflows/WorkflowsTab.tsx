import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Workflow as WorkflowIcon } from 'lucide-react';
import { WorkflowItem } from '@/types/dataSource';
import { Service } from '@/types/config';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowFormDialog } from './dialogs/WorkflowFormDialog';
import WorkflowJsonEditorDialog from './dialogs/WorkflowJsonEditorDialog';


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
  const [addOpen, setAddOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [jsonIndex, setJsonIndex] = useState<number | null>(null);
  const editing = editIndex !== null ? workflows[editIndex] : null;
  const jsonEditing = jsonIndex !== null ? workflows[jsonIndex] : null;


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <WorkflowIcon className="h-5 w-5" />
            Workflows
            <span className="text-sm font-normal text-muted-foreground">
              ({workflows.length})
            </span>
          </CardTitle>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {workflows.length === 0 ? (
          <div className="border border-dashed rounded-md py-10 text-center text-sm text-muted-foreground">
            <WorkflowIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="mb-3">No workflows yet</p>
            <Button onClick={() => setAddOpen(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Workflow
            </Button>
          </div>
        ) : (
          workflows.map((workflow, index) => (
            <WorkflowCard
              key={`${workflow.serviceId ?? 'wf'}-${index}`}
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
              onUpdate={(wf) => updateWorkflow(index, wf)}
            />
          ))
        )}
      </CardContent>

      <WorkflowFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Workflow"
        services={services}
        showCatalogueRail
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
