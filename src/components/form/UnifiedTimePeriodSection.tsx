import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TimeframeType } from '@/types/config';
import { dateToTimestamp, timestampToDate, getRepresentativeTimestamp } from '@/utils/dateUtils';

interface UnifiedTimePeriodSectionProps {
  timeframe: TimeframeType;
  defaultTimestamp?: number;
  onUpdate: (field: string, value: any) => void;
}

const UnifiedTimePeriodSection = ({
  timeframe,
  defaultTimestamp,
  onUpdate
}: UnifiedTimePeriodSectionProps) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    defaultTimestamp ? timestampToDate(defaultTimestamp) : undefined
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date && timeframe !== 'None') {
      const representativeTimestamp = getRepresentativeTimestamp(date, timeframe);
      onUpdate('defaultTimestamp', representativeTimestamp);
      setSelectedDate(timestampToDate(representativeTimestamp));
    } else {
      setSelectedDate(date);
      onUpdate('defaultTimestamp', date ? dateToTimestamp(date) : undefined);
    }
  };

  const getDateFormatPlaceholder = () => {
    switch (timeframe) {
      case 'Years':
        return 'Select year';
      case 'Months':
        return 'Select month';
      case 'Days':
        return 'Select date';
      default:
        return 'Select date';
    }
  };

  const getDateDisplayFormat = () => {
    switch (timeframe) {
      case 'Years':
        return 'yyyy';
      case 'Months':
        return 'MMMM yyyy';
      case 'Days':
        return 'PP';
      default:
        return 'PP';
    }
  };

  if (timeframe === 'None') return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Default Time Period</h4>
      
      <div className="space-y-2">
        <Label>Default Time Period</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, getDateDisplayFormat())
              ) : (
                <span>{getDateFormatPlaceholder()}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <p className="text-sm text-muted-foreground">
          This sets the default time period for new data sources in this layer.
        </p>
      </div>
    </div>
  );
};

export default UnifiedTimePeriodSection;