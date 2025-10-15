import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ConfigStatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  gradient?: string;
}

export const ConfigStatCard = ({ icon: Icon, value, label, gradient = 'from-primary/10 to-primary/5' }: ConfigStatCardProps) => {
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md overflow-hidden">
      <CardContent className="p-4 relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none`} />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-primary" />
            <div className="text-xl font-bold text-foreground">{value}</div>
          </div>
          <div className="text-xs text-muted-foreground font-medium text-center">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
};
