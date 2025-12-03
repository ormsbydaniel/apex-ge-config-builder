import React from 'react';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TimeframeType } from '@/types/config';
import { dateToTimestamp, timestampToDate, formatTimestampForTimeframe, getRepresentativeTimestamp } from '@/utils/dateUtils';

interface TimestampManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timestamps: number[];
  timeframe: TimeframeType;
  onUpdate: (timestamps: number[]) => void;
}

const TimestampManagementDialog = ({
  isOpen,
  onClose,
  timestamps,
  timeframe,
  onUpdate
}: TimestampManagementDialogProps) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

  const handleAddTimestamp = () => {
    if (selectedDate && timeframe !== 'None') {
      let dateToAdd = selectedDate;
      
      // If timeframe is 'Time', apply the time value
      if (timeframe === 'Time') {
        const [hours, minutes] = timeValue.split(':').map(Number);
        dateToAdd = new Date(selectedDate);
        dateToAdd.setHours(hours, minutes, 0, 0);
      }
      
      const representativeTimestamp = getRepresentativeTimestamp(dateToAdd, timeframe);
      
      // Check if timestamp already exists
      if (!timestamps.includes(representativeTimestamp)) {
        const newTimestamps = [...timestamps, representativeTimestamp].sort((a, b) => a - b);
        onUpdate(newTimestamps);
      }
      setSelectedDate(undefined);
      if (timeframe === 'Time') {
        setTimeValue('12:00');
      }
    }
  };

  const handleRemoveTimestamp = (timestamp: number) => {
    const newTimestamps = timestamps.filter(t => t !== timestamp);
    onUpdate(newTimestamps);
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
  const [timeValue, setTimeValue] = React.useState<string>('12:00');

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Timestamps</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {timeframe !== 'None' && (
            <div className="space-y-2">
              <h4 className="font-medium">Add New Timestamp</h4>
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
                        <span>Select date{timeframe === 'Time' ? ' & time' : ''}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
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
                <Button 
                  onClick={handleAddTimestamp}
                  disabled={!selectedDate}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Current Timestamps ({timestamps.length})</h4>
            {timestamps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timestamps added yet.</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {timestamps
                  .sort((a, b) => b - a) // Sort by most recent first
                  .map((timestamp, index) => (
                    <div key={timestamp} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">
                        {formatTimestampForTimeframe(timestamp, timeframe)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTimestamp(timestamp)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimestampManagementDialog;