import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
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
  const disabled = availableSourceLayers.length === 0;

  const grouped = useMemo(
    () => buildGroupedLayers(availableSourceLayers, interfaceGroupOrder),
    [availableSourceLayers, interfaceGroupOrder],
  );

  const handleSelect = (name: string) => {
    const layer = availableSourceLayers.find(l => l.name === name);
    if (!layer) return;
    setOpen(false);
    if (hasExistingCategories) {
      onRequestAppendReplace(layer);
    } else {
      onCopy(layer, 'replace');
    }
  };

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value=""
      onValueChange={handleSelect}
    >
      <SelectTrigger
        asChild
        disabled={disabled}
        title={disabled ? 'No other layers with categories available' : undefined}
      >
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Copy className="h-4 w-4 mr-2" />
          Copy from layer
        </Button>
      </SelectTrigger>
      <SelectContent align="start" className="max-h-80">
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
  );
};

export default CategoryCopyFromLayerButton;
