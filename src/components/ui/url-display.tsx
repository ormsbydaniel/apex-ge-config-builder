
import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractDisplayName, truncateUrl } from '@/utils/urlDisplay';
import { cn } from '@/lib/utils';

interface UrlDisplayProps {
  url: string;
  format: string;
  className?: string;
  maxLength?: number;
  showCopyButton?: boolean;
}

const UrlDisplay = ({ 
  url, 
  format, 
  className, 
  maxLength = 40,
  showCopyButton = true 
}: UrlDisplayProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  if (!url) return null;
  
  const displayName = extractDisplayName(url, format);
  const shouldTruncate = displayName.length > maxLength;
  const truncatedName = shouldTruncate ? truncateUrl(displayName, maxLength) : displayName;
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "URL Copied",
        description: "The full URL has been copied to your clipboard.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm text-slate-600 truncate cursor-help min-w-0 flex-1">
            {truncatedName}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md break-all">
          <div className="space-y-1">
            <div className="font-medium">Full URL:</div>
            <div className="text-xs">{url}</div>
          </div>
        </TooltipContent>
      </Tooltip>
      
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 flex-shrink-0"
          title="Copy full URL"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
};

export default UrlDisplay;
