import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Database, Server, Globe, Copy } from "lucide-react";
import { Service } from "@/types/config";
import { toast } from "sonner";

interface ServiceCardListProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  filterFn?: (service: Service) => boolean;
  emptyMessage?: string;
}

const getServiceIcon = (service: Service) => {
  if (service.sourceType === 's3') {
    return <Database className="h-4 w-4 text-green-600" />;
  } else if (service.sourceType === 'stac') {
    return <Server className="h-4 w-4 text-purple-600" />;
  } else {
    return <Globe className="h-4 w-4 text-blue-600" />;
  }
};

const getBorderColor = (service: Service) => {
  if (service.sourceType === 's3') return 'border-l-green-500';
  if (service.sourceType === 'stac') return 'border-l-purple-500';
  return 'border-l-blue-500';
};

const getTextColor = (service: Service) => {
  if (service.sourceType === 's3') return 'text-green-700';
  if (service.sourceType === 'stac') return 'text-purple-700';
  return 'text-blue-700';
};

const getBadgeColor = (service: Service) => {
  if (service.sourceType === 's3') return 'border-green-300 text-green-700';
  if (service.sourceType === 'stac') return 'border-purple-300 text-purple-700';
  return 'border-blue-300 text-blue-700';
};

const getServiceTypeLabel = (service: Service) => {
  if (service.sourceType === 's3') return 'S3 Bucket';
  if (service.sourceType === 'stac') return 'STAC';
  return service.format?.toUpperCase();
};

const getResourceCountLabel = (service: Service) => {
  if (service.sourceType === 's3') return 'objects';
  if (service.sourceType === 'stac') return 'collections';
  return 'layers';
};

const getPriority = (service: Service) => {
  if (service.sourceType === 'stac') return 1;
  if (service.format === 'wms' || service.format === 'wmts') return 2;
  if (service.sourceType === 's3') return 3;
  return 4;
};

export const ServiceCardList = ({
  services,
  onServiceSelect,
  filterFn,
  emptyMessage = "No services configured. Add new services via the Services menu above."
}: ServiceCardListProps) => {
  const filteredServices = filterFn ? services.filter(filterFn) : services;
  
  const sortedServices = filteredServices
    .slice()
    .sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same priority, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  if (sortedServices.length === 0) {
    return (
      <div className="p-4 bg-muted/50 border rounded-lg text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {sortedServices.map((service) => (
        <Card key={service.id} className={`border-l-4 overflow-hidden ${getBorderColor(service)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getServiceIcon(service)}
                  <h3 className={`font-medium ${getTextColor(service)}`}>
                    {service.name}
                  </h3>
                  <Badge variant="outline" className={getBadgeColor(service)}>
                    {getServiceTypeLabel(service)}
                  </Badge>
                  {service.capabilities?.layers.length && (
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {service.capabilities.layers.length} {getResourceCountLabel(service)} available
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground truncate cursor-default">{service.url}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-md break-all">
                        <p>{service.url}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(service.url);
                            toast.success("URL copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onServiceSelect(service)}
              >
                Select
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
