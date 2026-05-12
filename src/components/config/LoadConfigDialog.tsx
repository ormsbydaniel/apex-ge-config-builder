import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  Github,
  Loader2,
  Search,
  AlertCircle,
  ChevronRight,
  Check,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useConfigImport } from '@/hooks/useConfigIO';
import type { ImportProgress } from '@/hooks/useConfigImport';
import { ValidationErrorDetails } from '@/types/config';
import { ModalErrorBoundary } from '@/components/common/ModalErrorBoundary';

const DEFAULT_REPO = 'ESA-APEx/apex_geospatial_explorer_configs';
const DEFAULT_BRANCH = 'main';

interface LoadConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: (
    errors: ValidationErrorDetails[],
    fileName: string,
    recovery?: { rawConfig: any; sourceLabel: string; loadedSource: import('@/contexts/ConfigContext').LoadedConfigSource },
  ) => void;
}

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

type Stage = 'idle' | 'parse' | 'normalize' | 'validate' | 'done';

const LoadConfigDialog = ({ open, onOpenChange, onError }: LoadConfigDialogProps) => {
  const { importConfig, importConfigFromUrl } = useConfigImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<string>('upload');

  // GitHub state
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [repoInput, setRepoInput] = useState(DEFAULT_REPO);
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [branches, setBranches] = useState<string[]>([DEFAULT_BRANCH]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isEditingRepo, setIsEditingRepo] = useState(false);

  // Loading view state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string>('');
  const [stage, setStage] = useState<Stage>('idle');
  const abortRef = useRef<AbortController | null>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setActiveTab('upload');
      setSearch('');
      setIsLoading(false);
      setStage('idle');
    }
  }, [open]);

  const fetchBranches = async (targetRepo: string) => {
    setBranchesLoading(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${targetRepo}/branches?per_page=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const names: string[] = data.map((b: any) => b.name);
      setBranches(names.length ? names : [DEFAULT_BRANCH]);
      if (names.includes(DEFAULT_BRANCH)) {
        setBranch(DEFAULT_BRANCH);
      } else if (names.length) {
        setBranch(names[0]);
      }
    } catch {
      setBranches([DEFAULT_BRANCH]);
      setBranch(DEFAULT_BRANCH);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchTree = async (targetRepo: string, targetBranch: string) => {
    setTreeLoading(true);
    setTreeError(null);
    setTree([]);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${targetRepo}/git/trees/${targetBranch}?recursive=1`,
      );
      if (!res.ok) throw new Error(`Failed to load repo tree (HTTP ${res.status})`);
      const data = await res.json();
      const entries: TreeEntry[] = (data.tree || [])
        .filter((e: any) => e.type === 'blob' && e.path.endsWith('config.json'))
        .map((e: any) => ({ path: e.path, type: e.type, size: e.size }));
      setTree(entries);
    } catch (e: any) {
      setTreeError(e?.message || 'Failed to load repository tree');
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    if (!open || activeTab !== 'github') return;
    fetchBranches(repo);
  }, [open, activeTab, repo]);

  useEffect(() => {
    if (!open || activeTab !== 'github') return;
    if (!branch) return;
    fetchTree(repo, branch);
  }, [open, activeTab, repo, branch]);

  const handleProgress = (e: ImportProgress) => {
    if (e.stage !== 'capabilities') {
      setStage(e.stage as Stage);
    }
  };

  const startLoading = (label: string) => {
    setIsLoading(true);
    setLoadingLabel(label);
    setStage('parse');
    abortRef.current = new AbortController();
  };

  const finishLoading = (
    success: boolean,
    errors?: ValidationErrorDetails[],
    fileName?: string,
  ) => {
    setIsLoading(false);
    abortRef.current = null;
    if (!success && errors) {
      onOpenChange(false);
      onError(errors, fileName || loadingLabel);
      return;
    }
    if (success) {
      onOpenChange(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    startLoading(file.name);
    const result = await importConfig(file, {
      onProgress: handleProgress,
      signal: abortRef.current?.signal,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    finishLoading(result.success, result.errors, file.name);
  };

  const handleLoadExample = async (exampleName?: string) => {
    const label = exampleName || 'Comprehensive demo';
    startLoading(label);
    const result = await importConfigFromUrl(
      '/examples/test-config.json',
      { type: 'example', label },
      {
        onProgress: handleProgress,
        signal: abortRef.current?.signal,
      },
    );
    finishLoading(result.success, result.errors, 'test-config.json');
  };

  const handleLoadFromGithub = async (path: string) => {
    startLoading(path);
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
    const result = await importConfigFromUrl(
      rawUrl,
      { type: 'github', label: `${repo}@${branch}/${path}` },
      {
        onProgress: handleProgress,
        signal: abortRef.current?.signal,
      },
    );
    finishLoading(result.success, result.errors, path);
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    onOpenChange(false);
  };

  const applyRepo = () => {
    const trimmed = repoInput
      .trim()
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/$/, '');
    if (trimmed && trimmed !== repo) {
      setRepo(trimmed);
    }
    setRepoInput(trimmed || repo);
    setIsEditingRepo(false);
  };

  const cancelEditRepo = () => {
    setRepoInput(repo);
    setIsEditingRepo(false);
  };

  const filteredTree = tree.filter(
    (e) => !search.trim() || e.path.toLowerCase().includes(search.toLowerCase()),
  );

  const examples = [
    {
      name: 'Comprehensive demo',
      description: 'A production-ready configuration showcasing many layer types and features.',
      url: '/examples/test-config.json',
      fileName: 'test-config.json',
    },
  ];

  // ---- Loading view subcomponent ----
  const renderLoadingView = () => {
    const stageReached = (s: Stage): boolean => {
      const order: Stage[] = ['parse', 'normalize', 'validate', 'done'];
      return order.indexOf(stage) >= order.indexOf(s);
    };
    const progressPct =
      stage === 'done'
        ? 100
        : stageReached('validate')
          ? 60
          : stageReached('normalize')
            ? 40
            : 20;

    const StageRow = ({ s, label }: { s: Stage; label: string }) => {
      const reached = stageReached(s);
      const isCurrent = stage === s && stage !== 'done';
      return (
        <div className="flex items-center gap-2 text-sm">
          {reached && !isCurrent ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : isCurrent ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground/50" />
          )}
          <span className={reached ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
      );
    };

    return (
      <div className="flex-1 min-h-0 flex flex-col gap-4 mt-2">
        <div className="space-y-1">
          <div className="text-sm font-medium truncate">Loading {loadingLabel}</div>
        </div>

        <Progress value={progressPct} className="h-2" />

        <div className="space-y-1.5">
          <StageRow s="parse" label="Parsing JSON" />
          <StageRow s="normalize" label="Normalizing structure" />
          <StageRow s="validate" label="Validating schema" />
          <StageRow s="done" label="Done" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Block close while loading (unless explicit cancel button used)
        if (!next && isLoading && stage !== 'done') return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl h-[640px] max-h-[90vh] flex flex-col">
        <ModalErrorBoundary
          onClose={() => onOpenChange(false)}
          resetKey={open ? `${activeTab}:${isLoading ? 'loading' : 'idle'}` : 'closed'}
        >
        <DialogHeader>
          <DialogTitle>Load Configuration</DialogTitle>
          <DialogDescription>
            {isLoading
              ? 'Loading configuration — please wait.'
              : 'Choose a source to load a configuration from.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          renderLoadingView()
        ) : (
          <>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="examples">
                  <FileText className="h-4 w-4 mr-2" />
                  Examples
                </TabsTrigger>
                <TabsTrigger value="github">
                  <Github className="h-4 w-4 mr-2" />
                  From GitHub
                </TabsTrigger>
              </TabsList>

              {/* Upload */}
              <TabsContent value="upload" className="mt-4 flex-1 min-h-0 overflow-auto">
                <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Upload a configuration JSON file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a <code>.json</code> file from your computer.
                    </p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFile}
                    className="hidden"
                  />
                </div>
              </TabsContent>

              {/* Examples */}
              <TabsContent value="examples" className="mt-4 flex-1 min-h-0 overflow-auto">
                <div className="space-y-2">
                  {examples.map((ex) => (
                    <button
                      key={ex.url}
                      onClick={() => handleLoadExample(ex.name)}
                      className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-sm">{ex.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{ex.description}</div>
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* From GitHub */}
              <TabsContent value="github" className="mt-4 space-y-3 flex-1 min-h-0 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3 items-end">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Repository (owner/name)
                      </label>
                      {!isEditingRepo && (
                        <button
                          type="button"
                          onClick={() => setIsEditingRepo(true)}
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
                        >
                          Change
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {isEditingRepo ? (
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          value={repoInput}
                          onChange={(e) => setRepoInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              applyRepo();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEditRepo();
                            }
                          }}
                          placeholder="owner/repo"
                        />
                        <Button variant="ghost" size="icon" onClick={applyRepo} title="Apply">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEditRepo} title="Cancel">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm font-mono text-foreground truncate py-2 px-3 rounded-md border border-border bg-muted/30">
                        {repo}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Branch</label>
                    <Select value={branch} onValueChange={setBranch} disabled={branchesLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={branchesLoading ? 'Loading…' : 'Select branch'} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search configs…"
                    className="pl-9"
                  />
                </div>

                <div className="border border-border rounded-lg max-h-[360px] overflow-y-auto">
                  {treeLoading && (
                    <div className="p-6 flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading repository…
                    </div>
                  )}
                  {!treeLoading && treeError && (
                    <div className="p-6 flex flex-col items-center justify-center gap-2 text-sm">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-destructive">{treeError}</p>
                      <Button size="sm" variant="outline" onClick={() => fetchTree(repo, branch)}>
                        Retry
                      </Button>
                    </div>
                  )}
                  {!treeLoading && !treeError && filteredTree.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      {tree.length === 0
                        ? 'No config.json files found in this repository.'
                        : 'No configs match your search.'}
                    </div>
                  )}
                  {!treeLoading && !treeError && filteredTree.length > 0 && (
                    <ul className="divide-y divide-border">
                      {filteredTree.map((entry) => {
                        const folder = entry.path.includes('/')
                          ? entry.path.split('/').slice(0, -1).join('/')
                          : '(root)';
                        return (
                          <li key={entry.path}>
                            <button
                              onClick={() => handleLoadFromGithub(entry.path)}
                              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate">{folder}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {entry.path}
                                </div>
                              </div>
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Public GitHub repos only. Loads files matching <code>**/config.json</code>.
                </p>
              </TabsContent>
            </Tabs>
          </>
        )}
        </ModalErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export default LoadConfigDialog;
