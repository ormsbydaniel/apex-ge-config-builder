import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { Category } from '@/types/config';

const UNGROUPED = 'Ungrouped';
const NO_SUBGROUP = '__no_subgroup__';

export interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
  interfaceGroup?: string;
  subinterfaceGroup?: string;
}

interface CategoryCopyFromLayerButtonProps {
  availableSourceLayers: AvailableSourceLayer[];
  hasExistingCategories: boolean;
  onCopy: (sourceLayer: AvailableSourceLayer, mode: 'append' | 'replace') => void;
  onRequestAppendReplace: (sourceLayer: AvailableSourceLayer) => void;
  /**
   * Canonical interface group order from the main config. Groups not listed
   * here (or layers with no group) are appended under "Ungrouped".
   */
  interfaceGroupOrder?: string[];
}

interface SubGroup {
  name: string; // "" means no sub-group
  layers: AvailableSourceLayer[];
}

interface Group {
  name: string;
  subgroups: SubGroup[];
}

const buildGroupedLayers = (
  layers: AvailableSourceLayer[],
  interfaceGroupOrder: string[],
): Group[] => {
  // Preserve discovery order for sub-groups and layers within them — this
  // mirrors the order of config.sources, which is how the main config UI
  // renders things.
  const groupMap = new Map<string, Map<string, AvailableSourceLayer[]>>();
  const groupOrder: string[] = [];

  layers.forEach(layer => {
    const groupName = layer.interfaceGroup?.trim() || UNGROUPED;
    const subName = layer.subinterfaceGroup?.trim() || '';
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, new Map());
      groupOrder.push(groupName);
    }
    const subMap = groupMap.get(groupName)!;
    if (!subMap.has(subName)) subMap.set(subName, []);
    subMap.get(subName)!.push(layer);
  });

  const orderedGroupNames = [
    ...interfaceGroupOrder.filter(g => groupMap.has(g)),
    ...groupOrder.filter(g => !interfaceGroupOrder.includes(g)),
  ];

  return orderedGroupNames.map(groupName => {
    const subMap = groupMap.get(groupName)!;
    const subgroups: SubGroup[] = Array.from(subMap.entries()).map(([name, layers]) => ({
      name,
      layers,
    }));
    return { name: groupName, subgroups };
  });
};

const CategoryCopyFromLayerButton = ({
  availableSourceLayers,
  hasExistingCategories,
  onCopy,
  onRequestAppendReplace,
  interfaceGroupOrder = [],
}: CategoryCopyFromLayerButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');

  const disabled = availableSourceLayers.length === 0;
  const selected = availableSourceLayers.find(l => l.name === selectedName);

  const grouped = useMemo(
    () => buildGroupedLayers(availableSourceLayers, interfaceGroupOrder),
    [availableSourceLayers, interfaceGroupOrder],
  );

  const handleCopy = () => {
    if (!selected) return;
    setOpen(false);
    if (hasExistingCategories) {
      onRequestAppendReplace(selected);
    } else {
      onCopy(selected, 'replace');
    }
    setSelectedName('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          title={disabled ? 'No other layers with categories available' : undefined}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy from layer
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Source layer</Label>
          <Select value={selectedName} onValueChange={setSelectedName}>
            <SelectTrigger>
              <SelectValue placeholder="Select a layer..." />
            </SelectTrigger>
            <SelectContent>
              {grouped.map(group => (
                <SelectGroup key={group.name}>
                  <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                    {group.name}
                  </SelectLabel>
                  {group.subgroups.map(sub => (
                    <React.Fragment key={`${group.name}::${sub.name || NO_SUBGROUP}`}>
                      {sub.name && (
                        <SelectLabel className="pl-4 text-xs font-normal text-muted-foreground">
                          {sub.name}
                        </SelectLabel>
                      )}
                      {sub.layers.map(layer => (
                        <SelectItem
                          key={layer.name}
                          value={layer.name}
                          className={sub.name ? 'pl-8' : 'pl-6'}
                        >
                          {layer.name} ({layer.categories.length})
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="text-xs text-muted-foreground">
              {selected.categories.length} categories
              {selected.hasValues ? ' (with values)' : ' (without values)'}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleCopy} disabled={!selected}>
              Copy
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryCopyFromLayerButton;
