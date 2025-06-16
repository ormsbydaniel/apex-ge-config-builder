
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

interface ExclusivitySetsSectionProps {
  exclusivitySets: string[];
  newExclusivitySet: string;
  onNewExclusivitySetChange: (value: string) => void;
  onAddExclusivitySet: () => void;
  onRemoveExclusivitySet: (index: number) => void;
}

const ExclusivitySetsSection = ({
  exclusivitySets,
  newExclusivitySet,
  onNewExclusivitySetChange,
  onAddExclusivitySet,
  onRemoveExclusivitySet
}: ExclusivitySetsSectionProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddExclusivitySet();
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Exclusivity Sets</CardTitle>
        <CardDescription>
          Define which layers should be mutually exclusive (only one can be active at a time).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newExclusivitySet}
              onChange={(e) => onNewExclusivitySetChange(e.target.value)}
              placeholder="Enter exclusivity set name"
              onKeyPress={handleKeyPress}
              className="border-primary/30 focus:border-primary"
            />
            <Button 
              onClick={onAddExclusivitySet}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exclusivitySets.map((set: string, index: number) => (
              <Badge key={index} variant="outline" className="flex items-center gap-2 border-primary/30 text-primary">
                {set}
                <button
                  onClick={() => onRemoveExclusivitySet(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExclusivitySetsSection;
