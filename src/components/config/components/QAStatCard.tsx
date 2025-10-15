import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QAStatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorClass: string;
  bgGradient: string;
  onClick?: () => void;
}

export const QAStatCard = ({ icon: Icon, value, label, colorClass, bgGradient, onClick }: QAStatCardProps) => {
  return (
    <Card 
      className={cn(
        "border-border/50 transition-all duration-200 hover:shadow-md overflow-hidden",
        onClick && "cursor-pointer hover:border-primary/30 hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-40 pointer-events-none`} />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className={cn("h-5 w-5", colorClass)} />
            <div className={cn("text-2xl font-bold", colorClass)}>{value}</div>
          </div>
          <div className="text-sm text-muted-foreground font-medium text-center">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
};
