import React from 'react';
import { ChevronRight } from 'lucide-react';

interface JsonBreadcrumbProps {
  path: string;
}

const JsonBreadcrumb = ({ path }: JsonBreadcrumbProps) => {
  if (!path) return null;

  const segments = path.split('.').filter(Boolean);

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border/50">
      <span className="font-medium text-foreground">Path:</span>
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3" />
          <span className={index === segments.length - 1 ? 'text-foreground font-medium' : ''}>
            {segment}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default JsonBreadcrumb;
