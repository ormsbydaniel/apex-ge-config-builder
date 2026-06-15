import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Copy, Trash2, ChevronUp, ChevronDown, FileJson } from 'lucide-react';
import { WorkflowItem } from '@/types/dataSource';

interface WorkflowCardProps {
  workflow: WorkflowItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onEditJson: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}


export const WorkflowCard = ({
  workflow,
  isFirst,
  isLast,
  onEdit,
  onEditJson,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: WorkflowCardProps) => {

  const title = workflow.serviceId || '(unnamed workflow)';
  const provider = workflow.serviceProvider;
  const description = workflow.meta?.description;

  return (
    <Card className="border-border">
      <CardContent className="p-3 flex items-start gap-3">
        <div className="flex flex-col gap-1 pt-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm truncate">{title}</h3>
            {provider && (
              <Badge variant="secondary" className="text-xs font-normal">
                {provider}
              </Badge>
            )}
            {workflow.serviceDetails?.endpoint && (
              <Badge variant="outline" className="text-xs font-normal">
                {workflow.serviceDetails.endpoint.replace(/^https?:\/\//, '').split('/')[0]}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Edit workflow">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDuplicate} aria-label="Duplicate workflow">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove workflow"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowCard;
