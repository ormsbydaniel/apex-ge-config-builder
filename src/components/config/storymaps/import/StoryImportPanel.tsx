import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Layers, AlertTriangle } from 'lucide-react';
import DonorConfigSourcePicker from '@/components/layers/import/DonorConfigSourcePicker';
import type { DonorSource } from '@/hooks/useDonorConfigLoader';
import { StorySchema } from '@/schemas/storySchema';
import { collectStoryLayerRefs } from '@/utils/storyImport';

export interface StoryImportSelection {
  stories: any[];
  /** Donor source objects for layers the user opted to bring across. */
  layers: any[];
}

interface StoryImportPanelProps {
  active: boolean;
  /** Source ids already present in the working configuration. */
  existingSourceIds: string[];
  onImport: (selection: StoryImportSelection) => void;
  onCancel: () => void;
}

interface DonorStoryEntry {
  story: any;
  index: number;
  valid: boolean;
  reason?: string;
  refs: string[];
}

/**
 * "Import story" flow: pick a donor configuration, choose one or more of its
 * stories, and optionally bring across any layers those stories reference that
 * are missing from the working configuration.
 */
export const StoryImportPanel: React.FC<StoryImportPanelProps> = ({
  active,
  existingSourceIds,
  onImport,
  onCancel,
}) => {
  const [donorConfig, setDonorConfig] = useState<any | null>(null);
  const [donorSource, setDonorSource] = useState<DonorSource | null>(null);
  const [selectedStories, setSelectedStories] = useState<Set<number>>(new Set());
  const [deselectedLayers, setDeselectedLayers] = useState<Set<string>>(new Set());

  const donorStories: DonorStoryEntry[] = useMemo(() => {
    const raw: any[] = Array.isArray(donorConfig?.stories) ? donorConfig.stories : [];
    return raw.map((story, index) => {
      const parsed = StorySchema.safeParse(story);
      return {
        story,
        index,
        valid: parsed.success,
        reason: parsed.success ? undefined : parsed.error.issues[0]?.message,
        refs: collectStoryLayerRefs(story),
      };
    });
  }, [donorConfig]);

  const donorSources: any[] = Array.isArray(donorConfig?.sources) ? donorConfig.sources : [];
  const existing = useMemo(() => new Set(existingSourceIds), [existingSourceIds]);

  // Layers referenced by the selected stories that are missing locally.
  const missingLayers = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of donorStories) {
      if (!selectedStories.has(entry.index)) continue;
      for (const ref of entry.refs) if (!existing.has(ref)) ids.add(ref);
    }
    return Array.from(ids).map((id) => ({
      id,
      source: donorSources.find((s: any) => s?.id === id) || null,
    }));
  }, [donorStories, selectedStories, existing, donorSources]);

  const resetDonor = () => {
    setDonorConfig(null);
    setDonorSource(null);
    setSelectedStories(new Set());
    setDeselectedLayers(new Set());
  };

  const toggleStory = (index: number) => {
    setSelectedStories((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleLayer = (id: string) => {
    setDeselectedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = () => {
    const stories = donorStories
      .filter((e) => selectedStories.has(e.index))
      .map((e) => e.story);
    const layers = missingLayers
      .filter((m) => m.source && !deselectedLayers.has(m.id))
      .map((m) => m.source);
    onImport({ stories, layers });
  };

  if (!donorConfig) {
    return (
      <div className="flex flex-col min-h-[360px]">
        <DonorConfigSourcePicker
          active={active}
          uploadHint="Select a .json configuration containing the story you want to copy. Your current configuration will not be replaced."
          onLoaded={(config, source) => {
            setDonorConfig(config);
            setDonorSource(source);
            setSelectedStories(new Set());
            setDeselectedLayers(new Set());
          }}
        />
      </div>
    );
  }

  const selectedCount = selectedStories.size;

  return (
    <div className="flex flex-col gap-3 min-h-[360px]">
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {donorSource?.label || 'Loaded configuration'}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {donorStories.length} stor{donorStories.length === 1 ? 'y' : 'ies'} found
          </div>
        </div>
      </div>

      {donorStories.length === 0 ? (
        <div className="border border-dashed rounded-md py-10 text-center text-sm text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          This configuration doesn&apos;t contain any stories.
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border max-h-[260px] overflow-y-auto">
          {donorStories.map((entry) => (
            <label
              key={`${entry.story?.id ?? 'story'}-${entry.index}`}
              className={`flex items-start gap-3 p-3 ${
                entry.valid ? 'cursor-pointer hover:bg-accent/50' : 'opacity-60'
              }`}
            >
              <Checkbox
                className="mt-0.5"
                disabled={!entry.valid}
                checked={selectedStories.has(entry.index)}
                onCheckedChange={() => entry.valid && toggleStory(entry.index)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium break-words">
                    {entry.story?.title || entry.story?.id || 'Untitled story'}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {(entry.story?.steps?.length ?? 0)} step
                    {(entry.story?.steps?.length ?? 0) === 1 ? '' : 's'}
                  </Badge>
                </div>
                {entry.story?.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">
                    {entry.story.description}
                  </p>
                )}
                {!entry.valid && (
                  <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    Can&apos;t import: {entry.reason || 'invalid story structure'}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {missingLayers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Layers used by the selected stories that aren&apos;t in your config
          </div>
          <div className="border border-border rounded-lg divide-y divide-border max-h-[160px] overflow-y-auto">
            {missingLayers.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-2.5 ${
                  m.source ? 'cursor-pointer hover:bg-accent/50' : 'opacity-60'
                }`}
              >
                <Checkbox
                  disabled={!m.source}
                  checked={!!m.source && !deselectedLayers.has(m.id)}
                  onCheckedChange={() => m.source && toggleLayer(m.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm break-words">{m.source?.name || m.id}</div>
                  <div className="text-xs text-muted-foreground font-mono break-all">{m.id}</div>
                </div>
                {!m.source && (
                  <span className="text-xs text-destructive shrink-0">
                    Not in the source config
                  </span>
                )}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Unticked layers are dropped from the imported story&apos;s steps.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={resetDonor}>
          Choose a different config
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selectedCount === 0}>
            Import {selectedCount > 0 ? `${selectedCount} ` : ''}stor
            {selectedCount === 1 ? 'y' : 'ies'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryImportPanel;
