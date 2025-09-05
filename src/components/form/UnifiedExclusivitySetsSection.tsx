import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface UnifiedExclusivitySetsSectionProps {
  availableExclusivitySets: string[];
  selectedExclusivitySets: string[];
  onUpdateExclusivitySets: (exclusivitySets: string[]) => void;
}

const UnifiedExclusivitySetsSection = ({
  availableExclusivitySets,
  selectedExclusivitySets,
  onUpdateExclusivitySets
}: UnifiedExclusivitySetsSectionProps) => {
  const handleToggleExclusivitySet = (setName: string, checked: boolean) => {
    if (checked) {
      onUpdateExclusivitySets([...selectedExclusivitySets, setName]);
    } else {
      onUpdateExclusivitySets(selectedExclusivitySets.filter(s => s !== setName));
    }
  };

  if (availableExclusivitySets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Exclusivity Sets</Label>
      <p className="text-xs text-muted-foreground">
        Select which exclusivity groups this layer belongs to
      </p>
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-primary">Layer Exclusivity</CardTitle>
          <CardDescription className="text-xs">
            Layers in the same exclusivity set are mutually exclusive (only one can be active at a time).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableExclusivitySets.map((setName) => (
            <div key={setName} className="flex items-center space-x-3">
              <Checkbox
                id={`exclusivity-${setName}`}
                checked={selectedExclusivitySets.includes(setName)}
                onCheckedChange={(checked) => handleToggleExclusivitySet(setName, checked as boolean)}
              />
              <label
                htmlFor={`exclusivity-${setName}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {setName}
              </label>
            </div>
          ))}
          
          {selectedExclusivitySets.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Selected exclusivity sets:</p>
              <div className="flex flex-wrap gap-2">
                {selectedExclusivitySets.map((setName) => (
                  <Badge key={setName} variant="outline" className="text-xs border-primary/30 text-primary">
                    {setName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedExclusivitySetsSection;