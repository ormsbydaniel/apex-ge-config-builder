import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { announcements } from '@/constants/announcements';
import { format } from 'date-fns';

const LatestUpdatesSection = () => {
  return (
    <Card className="bg-transparent border-teal-800/30">
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
                  className="group p-3 rounded-lg bg-teal-900/40 hover:bg-teal-900/60 transition-colors border border-teal-800/30"
                >
                  <Badge 
                    variant="outline" 
                    className="shrink-0 text-white/80 border-white/20 bg-teal-900/40"
                  >
                    {formattedDate}
                  </Badge>
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

export default LatestUpdatesSection;
