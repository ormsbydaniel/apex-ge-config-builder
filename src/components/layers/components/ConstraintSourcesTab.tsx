import { DataSource, Service } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { extractDisplayName } from '@/utils/urlDisplay';

interface ConstraintSourcesTabProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onAddConstraintSource: (layerIndex: number) => void;
  onRemove: (layerIndex: number, constraintIndex: number) => void;
  onEdit: (layerIndex: number, constraintIndex: number) => void;
}

export function ConstraintSourcesTab({
  source,
  services,
  layerIndex,
  onAddConstraintSource,
  onRemove,
  onEdit
}: ConstraintSourcesTabProps) {
  const hasConstraints = source.constraints && source.constraints.length > 0;

  return <div className="space-y-4">
      {hasConstraints ? <div className="space-y-3">
          {source.constraints.map((constraint, index) => <Card key={index}>
               <CardContent className="pt-4">
                <div className="space-y-2">
                  {/* Line 1: Constraint Name, Interactive Pill, Type Pill, Edit, Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{constraint.label}</h4>
                      <Badge variant={constraint.interactive ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {constraint.interactive ? 'Interactive' : 'Fixed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {constraint.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(layerIndex, index)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(layerIndex, index)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Line 2: Data Type Pill, Data File Name */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {constraint.format.toUpperCase()}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground truncate cursor-help">
                            {extractDisplayName(constraint.url, constraint.format)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md break-all">
                          <p className="text-xs">{constraint.url}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Additional lines: Remaining details */}
                  {constraint.type === 'continuous' && (
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>Min: {constraint.min}</span>
                      <span>Max: {constraint.max}</span>
                      {constraint.units && <span>Units: {constraint.units}</span>}
                    </div>
                  )}
                  
                  {constraint.type === 'categorical' && constraint.constrainTo && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Categories:</span>{' '}
                      {constraint.constrainTo.map((cat, i) => (
                        <span key={i}>
                          {cat.label} ({cat.value})
                          {i < constraint.constrainTo!.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>)}
        </div> : <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No constraint sources configured yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Constraint sources must be COG format and define continuous or categorical constraints
          </p>
        </div>}

      <div className="flex items-center justify-end pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log('[ConstraintSourcesTab] Button clicked for layerIndex:', layerIndex);
            console.log('[ConstraintSourcesTab] onAddConstraintSource:', onAddConstraintSource);
            onAddConstraintSource(layerIndex);
          }} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Constraint Source
        </Button>
      </div>
    </div>;
}