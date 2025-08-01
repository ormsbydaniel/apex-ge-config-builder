import React from 'react';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface TimeDimensionDisplayProps {
  source: DataSource;
}

const TimeDimensionDisplay = ({ source }: TimeDimensionDisplayProps) => {
  const timeframe = source.timeframe;
  
  if (!timeframe || timeframe === 'None') return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Time Dimension</h4>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600">
          <Clock className="h-3 w-3 mr-1" />
          {timeframe}
        </Badge>
      </div>
    </div>
  );
};

export default TimeDimensionDisplay;