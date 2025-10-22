import { DataSource } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
interface ConstraintSourcesTabProps {
  source: DataSource;
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, constraintIndex: number) => void;
  onEdit: (layerIndex: number, constraintIndex: number) => void;
}
export function ConstraintSourcesTab({
  source,
  layerIndex,
  onAdd,
  onRemove,
  onEdit
}: ConstraintSourcesTabProps) {
  const hasConstraints = source.constraints && source.constraints.length > 0;
  return <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={() => onAdd(layerIndex)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Constraint Source
        </Button>
      </div>

      {hasConstraints ? <div className="space-y-3">
          {source.constraints.map((constraint, index) => <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{constraint.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {constraint.format.toUpperCase()}
                      </Badge>
                      <Badge variant={constraint.interactive ? 'default' : 'secondary'} className="text-xs">
                        {constraint.interactive ? 'Interactive' : 'Fixed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {constraint.type}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="font-mono text-xs truncate">{constraint.url}</div>
                      
                      {constraint.type === 'continuous' && <div className="flex gap-4">
                          <span>Min: {constraint.min}</span>
                          <span>Max: {constraint.max}</span>
                          {constraint.units && <span>Units: {constraint.units}</span>}
                        </div>}
                      
                      {constraint.type === 'categorical' && constraint.constrainTo && <div>
                          <span className="font-semibold">Categories:</span>{' '}
                          {constraint.constrainTo.map((cat, i) => <span key={i}>
                              {cat.label} ({cat.value})
                              {i < constraint.constrainTo!.length - 1 ? ', ' : ''}
                            </span>)}
                        </div>}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(layerIndex, index)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(layerIndex, index)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
          <Button variant="outline" size="sm" onClick={() => onAdd(layerIndex)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Constraint Source
          </Button>
        </div>}
    </div>;
}