import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight } from 'lucide-react';
import { DataSource } from '@/types/config';
import {
  generateAutoTunePreview,
  generateAutoTuneSummary,
  AutoTunePreviewItem,
  Z_BASE_LAYER_RASTER,
  Z_STANDARD_RASTER,
  Z_VECTOR_POLYGON,
  Z_VECTOR_LINE,
  Z_VECTOR_POINT,
} from '@/utils/drawOrderUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AutoTuneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: {
    sources: DataSource[];
  };
  onApply: () => void;
}

const AutoTuneDialog = ({ open, onOpenChange, config, onApply }: AutoTuneDialogProps) => {
  const preview = generateAutoTunePreview(config.sources);
  const summary = generateAutoTuneSummary(preview);
  const [showChangingOnly, setShowChangingOnly] = useState(false);

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const filteredPreview = showChangingOnly 
    ? preview.filter(item => item.willChange)
    : preview;

  const getZLevelDescription = (zLevel: number): string => {
    switch (zLevel) {
      case Z_BASE_LAYER_RASTER:
        return 'Base Raster';
      case Z_STANDARD_RASTER:
        return 'Standard Raster';
      case Z_VECTOR_POLYGON:
        return 'Vector Polygon';
      case Z_VECTOR_LINE:
        return 'Vector Line';
      case Z_VECTOR_POINT:
        return 'Vector Point';
      default:
        return 'Custom';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Auto Tune Z-Levels Preview
          </DialogTitle>
          <DialogDescription>
            Review the proposed Z-level assignments based on layer formats and types.
            Items that will change are highlighted.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-muted-foreground">Base Layer Rasters</div>
            <div className="text-lg font-semibold">{summary.baseLayerRasters} → Z=10</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground">Standard Rasters</div>
            <div className="text-lg font-semibold">{summary.standardRasters} → Z=50</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground">Vector Polygons</div>
            <div className="text-lg font-semibold">{summary.vectorPolygons} → Z=100</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground">Vector Lines</div>
            <div className="text-lg font-semibold">{summary.vectorLines} → Z=110</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground">Vector Points</div>
            <div className="text-lg font-semibold">{summary.vectorPoints} → Z=120</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground">Total Changes</div>
            <div className="text-lg font-semibold text-primary">{summary.totalChanges}</div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-changing"
            checked={showChangingOnly}
            onCheckedChange={setShowChangingOnly}
          />
          <Label htmlFor="show-changing" className="cursor-pointer">
            Show only changing layers ({summary.totalChanges})
          </Label>
        </div>

        {/* Preview Table */}
        <ScrollArea className="flex-1 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layer Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Current Z</TableHead>
                <TableHead className="text-center"></TableHead>
                <TableHead className="text-center">New Z</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPreview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {showChangingOnly ? 'No changes detected' : 'No data sources found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPreview.map((item, index) => (
                <TableRow
                  key={`${item.sourceIndex}-${item.sourceType}-${item.dataIndex}`}
                  className={item.willChange ? 'bg-yellow-500/10' : ''}
                >
                  <TableCell className="font-medium">
                    {item.layerName}
                    {item.sourceType === 'statistics' && (
                      <Badge variant="outline" className="ml-2 text-xs">stats</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.format}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.isBaseLayer ? (
                      <Badge variant="default">Base</Badge>
                    ) : (
                      <Badge variant="outline">Standard</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {item.currentZLevel}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.willChange && (
                      <ArrowRight className="h-4 w-4 text-primary inline" />
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono font-semibold">
                    {item.proposedZLevel}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getZLevelDescription(item.proposedZLevel)}
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={summary.totalChanges === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            Update Z Levels {summary.totalChanges > 0 && `(${summary.totalChanges})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoTuneDialog;
