import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  
  // State for calendar navigation
  const [month, setMonth] = React.useState<Date>(selectedDate || new Date());

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
      case 'Time':
        return 'Select date & time';
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
      case 'Time':
        return 'PPpp';
      default:
        return 'PP';
    }
  };

  // State for time input when timeframe is 'Time'
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '12:00';
  });

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (selectedDate && timeframe === 'Time') {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      onUpdate('defaultTimestamp', dateToTimestamp(newDate));
      setSelectedDate(newDate);
    }
  };

  // Generate year options (1900 to 2050)
  const yearOptions = Array.from({ length: 151 }, (_, i) => 1900 + i);
  
  // Month names
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month.getFullYear(), parseInt(monthIndex), 1);
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(parseInt(year), month.getMonth(), 1);
    setMonth(newMonth);
  };

  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    return (
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (timeframe === 'None') return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Default Time Period</h4>
      
      <div className="space-y-2">
        <Label>Default Time Period</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, timeframe === 'Time' ? 'PP' : getDateDisplayFormat())
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
                month={month}
                onMonthChange={setMonth}
                initialFocus
                className={cn("p-0 pointer-events-auto")}
                components={{
                  Caption: CustomCaption
                }}
              />
            </PopoverContent>
          </Popover>
          {timeframe === 'Time' && (
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          This sets the default time period for new data sources in this layer.
        </p>
      </div>
    </div>
  );
};

export default UnifiedTimePeriodSection;