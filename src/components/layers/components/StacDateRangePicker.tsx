import React, { useEffect, useState } from 'react';
import { format, startOfYear, endOfYear, subDays, subMonths } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/utils/dateUtils';

/** Values are datetime-local strings (yyyy-MM-ddTHH:mm) or '' for an open side. */
interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

const parse = (v: string) => (v ? new Date(v) : undefined);
const timeOf = (v: string, fallback: string) => (v ? v.slice(11, 16) || fallback : fallback);
const join = (d: Date | undefined, time: string) => (d ? `${format(d, 'yyyy-MM-dd')}T${time}` : '');

const StacDateRangePicker: React.FC<Props> = ({ start, end, onChange }) => {
  const [showTime, setShowTime] = useState(false);
  const startTime = timeOf(start, '00:00');
  const endTime = timeOf(end, '23:59');
  const range: DateRange | undefined = start || end ? { from: parse(start), to: parse(end) } : undefined;
  const [month, setMonth] = useState<Date>(parse(start) ?? subMonths(new Date(), 1));

  useEffect(() => {
    if ((start && startTime !== '00:00') || (end && endTime !== '23:59')) setShowTime(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRange = (from?: Date, to?: Date) => onChange(join(from, startTime), join(to, endTime));
  const year = new Date().getFullYear();
  const presets: { label: string; from?: Date; to?: Date }[] = [
    { label: 'Last 30 days', from: subDays(new Date(), 30), to: new Date() },
    { label: 'Last 3 months', from: subMonths(new Date(), 3), to: new Date() },
    { label: 'Last 12 months', from: subMonths(new Date(), 12), to: new Date() },
    { label: `${year}`, from: startOfYear(new Date(year, 0, 1)), to: endOfYear(new Date(year, 0, 1)) },
    { label: `${year - 1}`, from: startOfYear(new Date(year - 1, 0, 1)), to: endOfYear(new Date(year - 1, 0, 1)) },
    { label: `Summer ${year - 1}`, from: new Date(year - 1, 5, 1), to: new Date(year - 1, 7, 31) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Button key={p.label} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs"
            onClick={() => { setRange(p.from, p.to); if (p.from) setMonth(p.from); }}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex justify-center rounded-md border">
        <Calendar
          mode="range"
          numberOfMonths={2}
          month={month}
          onMonthChange={setMonth}
          selected={range}
          onSelect={(r) => setRange(r?.from, r?.to)}
          weekStartsOn={1}
          className={cn('p-3 pointer-events-auto')}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {([['Start', start, startTime, true], ['End', end, endTime, false]] as const).map(([label, value, time, isStart]) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{label}</Label>
              {value && (
                <button type="button" className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => onChange(isStart ? '' : start, isStart ? end : '')}>
                  Make open-ended
                </button>
              )}
            </div>
            <p className="text-sm">{value ? formatDisplayDate(value, showTime) : <span className="text-muted-foreground">Open {label.toLowerCase()}</span>}</p>
            {showTime && value && (
              <Input type="time" className="h-8" aria-label={`${label} time`} value={time}
                onChange={(e) => onChange(isStart ? join(parse(start), e.target.value || '00:00') : start, isStart ? end : join(parse(end), e.target.value || '23:59'))} />
            )}
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox checked={showTime} onCheckedChange={(c) => setShowTime(Boolean(c))} />
        Set times of day (otherwise whole days are used)
      </label>
    </div>
  );
};

export default StacDateRangePicker;
