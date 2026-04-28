import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, Search } from 'lucide-react';

interface DonorLayerTreeProps {
  donorConfig: any;
  selectedNames: Set<string>;
  onToggle: (name: string) => void;
  onSelectVisible: (names: string[]) => void;
  onClearAll: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

interface LeafNode {
  name: string;
}

interface SubGroupNode {
  key: string;
  label: string;
  leaves: LeafNode[];
}

interface GroupNode {
  key: string;
  label: string;
  subGroups: SubGroupNode[];
}

const UNGROUPED = '__ungrouped__';
const UNGROUPED_LABEL = '(Ungrouped)';

const buildTree = (sources: any[]): GroupNode[] => {
  const groupMap = new Map<string, Map<string, LeafNode[]>>();

  for (const src of sources) {
    if (!src || src.isBaseLayer === true) continue;
    if (typeof src.name !== 'string' || !src.name) continue;
    const ig = src.layout?.interfaceGroup?.trim() || UNGROUPED;
    const sg = src.layout?.subinterfaceGroup?.trim() || UNGROUPED;
    if (!groupMap.has(ig)) groupMap.set(ig, new Map());
    const sub = groupMap.get(ig)!;
    if (!sub.has(sg)) sub.set(sg, []);
    sub.get(sg)!.push({ name: src.name });
  }

  const groups: GroupNode[] = [];
  for (const [ig, subMap] of groupMap.entries()) {
    const subGroups: SubGroupNode[] = [];
    for (const [sg, leaves] of subMap.entries()) {
      subGroups.push({
        key: sg,
        label: sg === UNGROUPED ? UNGROUPED_LABEL : sg,
        leaves,
      });
    }
    // Stable-ish: alphabetical, with ungrouped last
    subGroups.sort((a, b) => {
      if (a.key === UNGROUPED) return 1;
      if (b.key === UNGROUPED) return -1;
      return a.label.localeCompare(b.label);
    });
    groups.push({
      key: ig,
      label: ig === UNGROUPED ? UNGROUPED_LABEL : ig,
      subGroups,
    });
  }
  groups.sort((a, b) => {
    if (a.key === UNGROUPED) return 1;
    if (b.key === UNGROUPED) return -1;
    return a.label.localeCompare(b.label);
  });
  return groups;
};

const filterTree = (tree: GroupNode[], search: string): GroupNode[] => {
  const q = search.trim().toLowerCase();
  if (!q) return tree;
  const out: GroupNode[] = [];
  for (const g of tree) {
    const subs: SubGroupNode[] = [];
    for (const sg of g.subGroups) {
      const leaves = sg.leaves.filter((l) => l.name.toLowerCase().includes(q));
      if (leaves.length) subs.push({ ...sg, leaves });
    }
    if (subs.length) out.push({ ...g, subGroups: subs });
  }
  return out;
};

const collectLeafNames = (tree: GroupNode[]): string[] => {
  const names: string[] = [];
  for (const g of tree) for (const sg of g.subGroups) for (const l of sg.leaves) names.push(l.name);
  return names;
};

export const DonorLayerTree = ({
  donorConfig,
  selectedNames,
  onToggle,
  onSelectVisible,
  onClearAll,
  search,
  onSearchChange,
}: DonorLayerTreeProps) => {
  const fullTree = useMemo(
    () => buildTree(Array.isArray(donorConfig?.sources) ? donorConfig.sources : []),
    [donorConfig],
  );
  const visibleTree = useMemo(() => filterTree(fullTree, search), [fullTree, search]);

  const totalCount = useMemo(() => collectLeafNames(fullTree).length, [fullTree]);
  const visibleNames = useMemo(() => collectLeafNames(visibleTree), [visibleTree]);

  // Default-open state per group key; recomputed when tree shape changes
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({});

  const isGroupOpen = (key: string) => openGroups[key] ?? true;
  const isSubGroupOpen = (key: string) => openSubGroups[key] ?? true;

  const toggleGroup = (key: string) =>
    setOpenGroups((s) => ({ ...s, [key]: !(s[key] ?? true) }));
  const toggleSubGroup = (key: string) =>
    setOpenSubGroups((s) => ({ ...s, [key]: !(s[key] ?? true) }));

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search layers…"
            className="pl-8 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectVisible(visibleNames)}
          disabled={visibleNames.length === 0}
        >
          Select all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          disabled={selectedNames.size === 0}
        >
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 rounded-md border border-border">
        <div className="p-2">
          {visibleTree.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              {totalCount === 0
                ? 'No layer cards available in this configuration.'
                : 'No layers match your search.'}
            </div>
          ) : (
            visibleTree.map((group) => {
              const groupKey = `g:${group.key}`;
              return (
                <Collapsible
                  key={groupKey}
                  open={isGroupOpen(groupKey)}
                  onOpenChange={() => toggleGroup(groupKey)}
                >
                  <CollapsibleTrigger className="flex items-center gap-1 w-full text-left py-1 px-1 rounded hover:bg-accent/50 text-sm font-medium">
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isGroupOpen(groupKey) ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="truncate">{group.label}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4">
                      {group.subGroups.map((sg) => {
                        const sgKey = `g:${group.key}|sg:${sg.key}`;
                        return (
                          <Collapsible
                            key={sgKey}
                            open={isSubGroupOpen(sgKey)}
                            onOpenChange={() => toggleSubGroup(sgKey)}
                          >
                            <CollapsibleTrigger className="flex items-center gap-1 w-full text-left py-1 px-1 rounded hover:bg-accent/50 text-xs font-medium text-muted-foreground">
                              <ChevronRight
                                className={`h-3 w-3 shrink-0 transition-transform ${
                                  isSubGroupOpen(sgKey) ? 'rotate-90' : ''
                                }`}
                              />
                              <span className="truncate">{sg.label}</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-5 py-0.5">
                                {sg.leaves.map((leaf) => {
                                  const checked = selectedNames.has(leaf.name);
                                  const id = `donor-leaf-${group.key}-${sg.key}-${leaf.name}`;
                                  return (
                                    <label
                                      key={leaf.name}
                                      htmlFor={id}
                                      className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent/40 cursor-pointer text-sm"
                                    >
                                      <Checkbox
                                        id={id}
                                        checked={checked}
                                        onCheckedChange={() => onToggle(leaf.name)}
                                      />
                                      <span className="truncate">{leaf.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="text-xs text-muted-foreground">
        {selectedNames.size} of {totalCount} selected
      </div>
    </div>
  );
};

export default DonorLayerTree;
