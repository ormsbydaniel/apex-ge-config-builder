import { useState } from 'react';
import { DataSource, Service } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { extractDisplayName } from '@/utils/urlDisplay';
import CogMetadataDialog from './CogMetadataDialog';
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
  const [metadataDialogIndex, setMetadataDialogIndex] = useState<number | null>(null);
  const hasConstraints = source.constraints && source.constraints.length > 0;
  return <div className="space-y-4">
      {hasConstraints ? <div className="space-y-3">
          {source.constraints.map((constraint, index) => <Card key={index}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {/* Line 1: Data type Pill, File Name (hover full), Info button, Edit, Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {constraint.format.toUpperCase()}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate cursor-help">
                              {extractDisplayName(constraint.url, constraint.format)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md break-all">
                            <p className="text-xs">{constraint.url}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {constraint.format?.toLowerCase() === 'cog' && constraint.url && <Button size="sm" variant="ghost" onClick={() => setMetadataDialogIndex(index)} className="h-6 w-6 p-0 shrink-0" title="View COG Metadata">
                          <Info className="h-3 w-3" />
                        </Button>}
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

                  {/* Line 2: All other information */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{constraint.label}</span>
                    <Badge variant={constraint.interactive ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {constraint.interactive ? 'Interactive' : 'Fixed'}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {constraint.type}
                    </Badge>
                    
                    {constraint.type === 'continuous' && <>
                        <span className="text-xs text-muted-foreground">Min: {constraint.min}</span>
                        <span className="text-xs text-muted-foreground">Max: {constraint.max}</span>
                        {constraint.units && <span className="text-xs text-muted-foreground">Units: {constraint.units}</span>}
                      </>}
                    
                    {constraint.type === 'categorical' && constraint.constrainTo && <span className="text-xs text-muted-foreground">
                        <span className="font-semibold">Categories:</span>{' '}
                        {constraint.constrainTo.map((cat, i) => <span key={i}>
                            {cat.label} ({cat.value})
                            {i < constraint.constrainTo!.length - 1 ? ', ' : ''}
                          </span>)}
                      </span>}
                  </div>
                </div>
              </CardContent>
              
              {/* COG Metadata Dialog */}
              {constraint.format?.toLowerCase() === 'cog' && constraint.url && metadataDialogIndex === index && <CogMetadataDialog url={constraint.url} filename={extractDisplayName(constraint.url, constraint.format)} isOpen={metadataDialogIndex === index} onClose={() => setMetadataDialogIndex(null)} />}
            </Card>)}
        </div> : <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No constraint sources configured yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Constraint sources must be COG format and define continuous or categorical constraints
          </p>
        </div>}

      
    </div>;
}