import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const StorymapsTab: React.FC = () => {
  return (
    <Card>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-4">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Storymaps</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Story map functionality is coming soon to the Geospatial Explorer. Watch this space!
        </p>
      </CardContent>
    </Card>
  );
};

export default StorymapsTab;
