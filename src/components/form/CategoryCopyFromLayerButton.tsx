import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const handleSelect = (layer: AvailableSourceLayer) => {
    setOpen(false);
    if (hasExistingCategories) {
      onRequestAppendReplace(layer);
    } else {
      onCopy(layer, 'replace');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto w-72">
        {grouped.map((group, groupIdx) => (
          <DropdownMenuGroup key={group.name}>
            {groupIdx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              {group.name}
            </DropdownMenuLabel>
            {group.subgroups.map(sub => (
              <React.Fragment key={`${group.name}::${sub.name || NO_SUBGROUP}`}>
                {sub.name && (
                  <DropdownMenuLabel className="pl-4 text-xs font-normal text-muted-foreground">
                    {sub.name}
                  </DropdownMenuLabel>
                )}
                {sub.layers.map(layer => (
                  <DropdownMenuItem
                    key={layer.name}
                    onSelect={() => handleSelect(layer)}
                    className={sub.name ? 'pl-8' : 'pl-6'}
                  >
                    <span className="flex-1 truncate">{layer.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({layer.categories.length})
                    </span>
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoryCopyFromLayerButton;
