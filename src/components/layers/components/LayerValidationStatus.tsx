import React from 'react';
import { Link, Link2Off, XCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LayerValidationResult } from '@/types/config';

interface LayerValidationStatusProps {
  validationResult?: LayerValidationResult;
}

const LayerValidationStatus = ({ validationResult }: LayerValidationStatusProps) => {
  // Don't render if no validation has been run
  if (!validationResult) {
    return null;
  }

  const getValidationDisplay = () => {
    const { overallStatus, urlResults } = validationResult;
    
    // Count status types
    const errorCount = urlResults.filter(r => r.status === 'error').length;
    const validCount = urlResults.filter(r => r.status === 'valid').length;
    const skippedCount = urlResults.filter(r => r.status === 'skipped').length;
    const totalValidatable = urlResults.length - skippedCount;

    switch (overallStatus) {
      case 'checking':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          tooltip: 'Validation in progress...',
          animate: true
        };
      case 'valid':
        return {
          icon: Link,
          color: 'text-green-500',
          tooltip: totalValidatable === 0 
            ? 'No URLs to validate (all templates)'
            : `All ${totalValidatable} URL${totalValidatable !== 1 ? 's' : ''} validated successfully`
        };
      case 'partial':
        return {
          icon: Link2Off,
          color: 'text-amber-500',
          tooltip: `${errorCount} of ${totalValidatable} URLs failed validation`
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          tooltip: `All ${errorCount} URLs failed validation`
        };
      case 'not-validated':
        return {
          icon: Link,
          color: 'text-gray-400',
          tooltip: 'Not yet validated'
        };
      default:
        return null;
    }
  };

  const display = getValidationDisplay();
  if (!display) return null;

  const { icon: Icon, color, tooltip, animate } = display;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${color} flex-shrink-0 ml-2`}>
            <Icon className={`h-4 w-4 ${animate ? 'animate-spin' : ''}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LayerValidationStatus;
