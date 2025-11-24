import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, CheckSquare, Square, Layers } from 'lucide-react';
import { DataSourceFormat } from '@/types/config';

export interface PreviewAsset {
  id: string; // unique identifier
  itemId: string; // source STAC item ID
  assetKey: string; // asset key within the item
  url: string;
  format: DataSourceFormat | string;
  datetime?: string;
  roles?: string[];
  fileSize?: number;
  title?: string;
}

interface AssetPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: PreviewAsset[];
  onConfirm: (selectedAssets: PreviewAsset[]) => void;
}

type SortOption = 'format' | 'item' | 'size' | 'name' | 'datetime';

export const AssetPreviewDialog: React.FC<AssetPreviewDialogProps> = ({
  open,
  onOpenChange,
  assets,
  onConfirm,
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assets.map(a => a.id)));
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('format');

  // Initialize all assets as selected when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(assets.map(a => a.id)));
    }
  }, [open, assets]);

  // Get unique formats and roles for filters
  const { formats, roles } = useMemo(() => {
    const formatMap = new Map<string, number>();
    const roleSet = new Set<string>();

    assets.forEach(asset => {
      formatMap.set(asset.format, (formatMap.get(asset.format) || 0) + 1);
      asset.roles?.forEach(role => roleSet.add(role));
    });

    return {
      formats: Array.from(formatMap.entries()).map(([format, count]) => ({ format, count })),
      roles: Array.from(roleSet).sort(),
    };
  }, [assets]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.itemId.toLowerCase().includes(term) ||
        asset.assetKey.toLowerCase().includes(term) ||
        asset.title?.toLowerCase().includes(term)
      );
    }

    // Format filter
    if (selectedFormats.size > 0) {
      filtered = filtered.filter(asset => selectedFormats.has(asset.format));
    }

    // Role filter
    if (selectedRoles.size > 0) {
      filtered = filtered.filter(asset =>
        asset.roles?.some(role => selectedRoles.has(role))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'format':
          return a.format.localeCompare(b.format);
        case 'item':
          return a.itemId.localeCompare(b.itemId);
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'name':
          return a.assetKey.localeCompare(b.assetKey);
        case 'datetime':
          return (b.datetime || '').localeCompare(a.datetime || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [assets, searchTerm, selectedFormats, selectedRoles, sortBy]);

  // Selection handlers
  const toggleAsset = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredAssets.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const invertSelection = () => {
    setSelectedIds(prev => {
      const next = new Set<string>();
      filteredAssets.forEach(asset => {
        if (!prev.has(asset.id)) {
          next.add(asset.id);
        }
      });
      return next;
    });
  };

  const selectByFormat = (format: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredAssets.forEach(asset => {
        if (asset.format === format) {
          next.add(asset.id);
        }
      });
      return next;
    });
  };

  const toggleFormatFilter = (format: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(format)) {
        next.delete(format);
      } else {
        next.add(format);
      }
      return next;
    });
  };

  const toggleRoleFilter = (role: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  // Calculate summary
  const selectedAssets = assets.filter(a => selectedIds.has(a.id));
  const formatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedAssets.forEach(asset => {
      counts.set(asset.format, (counts.get(asset.format) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([format, count]) => `${count} ${format.toUpperCase()}`)
      .join(', ');
  }, [selectedAssets]);

  const handleConfirm = () => {
    onConfirm(selectedAssets);
    onOpenChange(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (datetime?: string) => {
    if (!datetime) return '';
    try {
      return new Date(datetime).toLocaleDateString();
    } catch {
      return datetime;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Assets Before Adding</DialogTitle>
          <DialogDescription>
            Found {assets.length} supported {assets.length === 1 ? 'asset' : 'assets'} from {new Set(assets.map(a => a.itemId)).size} {new Set(assets.map(a => a.itemId)).size === 1 ? 'item' : 'items'}
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-3 py-2 border-b">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item ID, asset name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Format and Role Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Format Filter */}
            {formats.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <Label className="text-xs text-muted-foreground">Format:</Label>
                {formats.map(({ format, count }) => (
                  <div key={format} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`format-${format}`}
                      checked={selectedFormats.has(format)}
                      onCheckedChange={() => toggleFormatFilter(format)}
                    />
                    <label
                      htmlFor={`format-${format}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      {format.toUpperCase()} ({count})
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Role Filter */}
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <Label className="text-xs text-muted-foreground">Role:</Label>
                {roles.map(role => (
                  <div key={role} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.has(role)}
                      onCheckedChange={() => toggleRoleFilter(role)}
                    />
                    <label
                      htmlFor={`role-${role}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <Label className="text-xs text-muted-foreground">Sort:</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="format">Format</SelectItem>
                  <SelectItem value="item">Source Item</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                  <SelectItem value="datetime">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        <div className="flex flex-wrap gap-2 py-2 border-b">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All ({filteredAssets.length})
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            <Square className="h-4 w-4 mr-1" />
            Deselect All
          </Button>
          <Button variant="outline" size="sm" onClick={invertSelection}>
            <Layers className="h-4 w-4 mr-1" />
            Invert
          </Button>
          {formats.length > 1 && formats.slice(0, 2).map(({ format }) => (
            <Button
              key={format}
              variant="outline"
              size="sm"
              onClick={() => selectByFormat(format)}
            >
              Select All {format.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Asset List */}
        <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
          <div className="space-y-2 pr-4">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No assets match the current filters</p>
              </div>
            ) : (
              filteredAssets.map(asset => {
                const isSelected = selectedIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleAsset(asset.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAsset(asset.id)}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {asset.itemId}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm">{asset.assetKey}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="text-xs">
                          {asset.format.toUpperCase()}
                        </Badge>
                        {asset.roles?.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {asset.fileSize && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(asset.fileSize)}
                          </span>
                        )}
                        {asset.datetime && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(asset.datetime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            <strong>Selected: {selectedAssets.length} of {assets.length} assets</strong>
            {formatCounts && <span className="ml-2">| {formatCounts}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedAssets.length === 0}>
              Add Selected Assets ({selectedAssets.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
