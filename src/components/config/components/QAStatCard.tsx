import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QAStatCardProps {
  icon: LucideIcon;
  /** Numeric value, or `null` when the stat is disabled / not yet computed. */
  value: number | null;
  label: string;
  colorClass: string;
  bgGradient: string;
  onClick?: () => void;
  /** When true, render the card in a muted, non-interactive state. */
  disabled?: boolean;
  /** Tooltip shown on hover (especially useful when disabled). */
  tooltip?: string;
}

export const QAStatCard = ({
  icon: Icon,
  value,
  label,
  colorClass,
  bgGradient,
  onClick,
  disabled = false,
  tooltip,
}: QAStatCardProps) => {
  const isInteractive = !!onClick && !disabled;
  const displayValue = value === null ? '–' : value;

  const card = (
    <Card
      className={cn(
        "border-border/50 transition-all duration-200 overflow-hidden",
        disabled && "opacity-60",
        isInteractive && "cursor-pointer hover:shadow-md hover:border-primary/30 hover:scale-[1.02]",
        !isInteractive && "cursor-default",
      )}
      onClick={isInteractive ? onClick : undefined}
    >
      <CardContent className="p-4 relative">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none",
            bgGradient,
            disabled && "opacity-20",
          )}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className={cn("h-5 w-5", disabled ? "text-muted-foreground" : colorClass)} />
            <div className={cn("text-2xl font-bold", disabled ? "text-muted-foreground" : colorClass)}>
              {displayValue}
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium text-center">{label}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (!tooltip) return card;

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{card}</div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
