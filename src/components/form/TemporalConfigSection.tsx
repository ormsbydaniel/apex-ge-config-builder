import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TimeframeType } from '@/types/config';
import { dateToTimestamp, timestampToDate, getRepresentativeTimestamp } from '@/utils/dateUtils';

interface TemporalConfigSectionProps {
  timeframe: TimeframeType;
  defaultTimestamp?: number;
  onUpdate: (field: string, value: any) => void;
}

const TemporalConfigSection = ({
  timeframe,
  defaultTimestamp,
  onUpdate
}: TemporalConfigSectionProps) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    defaultTimestamp ? timestampToDate(defaultTimestamp) : undefined
  );

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    onUpdate('timeframe', newTimeframe);
    
    // If switching to 'None', clear the default timestamp
    if (newTimeframe === 'None') {
      onUpdate('defaultTimestamp', undefined);
      setSelectedDate(undefined);
    } else if (!defaultTimestamp) {
      // If switching from 'None' to a temporal timeframe, set current date
      const now = new Date();
      const representativeTimestamp = getRepresentativeTimestamp(now, newTimeframe);
      onUpdate('defaultTimestamp', representativeTimestamp);
      setSelectedDate(timestampToDate(representativeTimestamp));
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="timeframe">Time Dimension</Label>
        <Select value={timeframe} onValueChange={handleTimeframeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select time dimension" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">None</SelectItem>
            <SelectItem value="Days">Days</SelectItem>
            <SelectItem value="Months">Months</SelectItem>
            <SelectItem value="Years">Years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {timeframe !== 'None' && (
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
      )}
    </div>
  );
};

export default TemporalConfigSection;