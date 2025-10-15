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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-background/80 backdrop-blur">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">{value}</div>
          </div>
          <div className="text-sm text-muted-foreground font-medium">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
};
