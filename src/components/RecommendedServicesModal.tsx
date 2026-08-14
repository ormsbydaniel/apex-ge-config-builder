import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Server, Database, FolderOpen } from 'lucide-react';
import { Service } from '@/types/config';

interface RecommendedServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onConfirm: (selectedServices: Service[]) => void;
  isLoading?: boolean;
}

const getServiceIcon = (service: Service) => {
  const sourceType = service.sourceType || 'service';
  switch (sourceType) {
    case 's3': return <Database className="h-4 w-4 text-amber-500" />;
    case 'stac': return <Server className="h-4 w-4 text-emerald-500" />;
    case 'catalogue': return <FolderOpen className="h-4 w-4 text-amber-600" />;
    default: return <Globe className="h-4 w-4 text-blue-500" />;
  }
};

const getTypeBadge = (service: Service) => {
  const sourceType = service.sourceType || 'service';
  const format = service.format || 'wms';
  switch (sourceType) {
    case 's3': return <Badge variant="outline" className="text-amber-600 border-amber-300">S3</Badge>;
    case 'stac': return <Badge variant="outline" className="text-emerald-600 border-emerald-300">STAC</Badge>;
    case 'catalogue': return <Badge variant="outline" className="text-amber-600 border-amber-300">Catalogue</Badge>;
    default: return <Badge variant="outline" className="text-blue-600 border-blue-300">{String(format).toUpperCase()}</Badge>;
  }
};

const RecommendedServicesModal = ({ isOpen, onClose, services, onConfirm, isLoading }: RecommendedServicesModalProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(services.map(s => s.id || s.url)));

  // Reset selections when services change
  React.useEffect(() => {
    setSelectedIds(new Set(services.map(s => s.id || s.url)));
  }, [services]);

  const handleToggle = (key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === services.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(services.map(s => s.id || s.url)));
    }
  };

  const handleConfirm = () => {
    const selected = services.filter(s => selectedIds.has(s.id || s.url));
    onConfirm(selected);
  };

  const allSelected = selectedIds.size === services.length;
  const noneSelected = selectedIds.size === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Recommended Services</DialogTitle>
          <DialogDescription>
            Select the services you want to add. Services already configured are excluded.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            {allSelected ? 'Deselect All' : 'Select All'} ({selectedIds.size}/{services.length})
          </label>
        </div>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-2">
            {services.map((service) => {
              const key = service.id || service.url;
              const isSelected = selectedIds.has(key);
              return (
                <div
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggle(key)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(key)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(service)}
                      <span className="font-medium text-sm truncate">{service.name}</span>
                      {getTypeBadge(service)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{service.url}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={noneSelected || isLoading}>
            {isLoading ? 'Adding...' : `Add ${selectedIds.size} Service${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendedServicesModal;
