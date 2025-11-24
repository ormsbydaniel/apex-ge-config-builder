import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { announcements, type Announcement } from '@/constants/announcements';
import { format } from 'date-fns';

const getCategoryColor = (category?: Announcement['category']) => {
  switch (category) {
    case 'Feature':
      return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
    case 'Improvement':
      return 'bg-green-500/20 text-green-200 border-green-400/30';
    case 'Fix':
      return 'bg-orange-500/20 text-orange-200 border-orange-400/30';
    case 'Info':
      return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
    default:
      return 'bg-muted/20 text-muted-foreground border-muted/30';
  }
};

const WhatsNewSection = () => {
  return (
    <Card className="bg-teal-900/40 border-teal-800/50">
      <CardHeader>
        <CardTitle className="text-white text-lg">Latest updates</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-3 pr-4">
            {announcements.map((announcement, index) => {
              const date = new Date(announcement.date);
              const formattedDate = format(date, 'd MMM yyyy');
              
              return (
                <div
                  key={index}
                  className="group p-3 rounded-lg bg-teal-950/30 hover:bg-teal-950/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant="outline" 
                      className="shrink-0 text-white/80 border-white/20 bg-teal-900/40"
                    >
                      {formattedDate}
                    </Badge>
                    {announcement.category && (
                      <Badge 
                        variant="outline"
                        className={`shrink-0 ${getCategoryColor(announcement.category)}`}
                      >
                        {announcement.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/90 mt-2 text-sm leading-relaxed">
                    {announcement.title}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WhatsNewSection;
