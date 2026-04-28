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
import { ModalErrorBoundary } from '@/components/common/ModalErrorBoundary';
import {
  useDonorConfigLoader,
  type DonorLoadStage,
  type DonorLoadResult,
  type DonorSource,
} from '@/hooks/useDonorConfigLoader';
import { ValidationErrorDetails } from '@/types/config';
import { DonorLayerTree } from './DonorLayerTree';

const DEFAULT_REPO = 'ESA-APEx/apex_geospatial_explorer_configs';
const DEFAULT_BRANCH = 'main';

interface DonorConfigPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetInterfaceGroup?: string;
  targetSubinterfaceGroup?: string;
}

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

const DonorConfigPickerDialog = ({
  open,
  onOpenChange,
  targetInterfaceGroup,
  targetSubinterfaceGroup,
}: DonorConfigPickerDialogProps) => {
  const { loadFromFile, loadFromUrl } = useDonorConfigLoader();
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

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string>('');
  const [stage, setStage] = useState<DonorLoadStage>('idle');

  // Donor result
  const [donorConfig, setDonorConfig] = useState<any | null>(null);
  const [donorSource, setDonorSource] = useState<DonorSource | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetails[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Donor selection state
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [layerSearch, setLayerSearch] = useState('');

  // Initialise state inside useEffect watching `open` to prevent stale overwrites
  useEffect(() => {
    if (open) {
      setActiveTab('upload');
      setSearch('');
      setIsLoading(false);
      setStage('idle');
      setDonorConfig(null);
      setDonorSource(null);
      setValidationErrors(null);
      setErrorMessage(null);
      setLoadingLabel('');
      setSelectedNames(new Set());
      setLayerSearch('');
    }
  }, [open]);

  const targetLabel = targetSubinterfaceGroup
    ? `${targetInterfaceGroup} / ${targetSubinterfaceGroup}`
    : targetInterfaceGroup;

  // ---- GitHub repo browsing ----
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

  // ---- Loading ----
  const startLoading = (label: string) => {
    setIsLoading(true);
    setLoadingLabel(label);
    setStage('parse');
    setValidationErrors(null);
    setErrorMessage(null);
  };

  const handleResult = (result: DonorLoadResult) => {
    setIsLoading(false);
    if (result.success && result.config) {
      setDonorConfig(result.config);
      setDonorSource(result.source || null);
    } else {
      setValidationErrors(result.errors || null);
      setErrorMessage(result.errorMessage || null);
      setStage('idle');
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    startLoading(file.name);
    const result = await loadFromFile(file, { onStage: setStage });
    if (fileInputRef.current) fileInputRef.current.value = '';
    handleResult(result);
  };

  const handleLoadExample = async () => {
    const label = 'Comprehensive demo';
    startLoading(label);
    const result = await loadFromUrl(
      '/examples/test-config.json',
      { type: 'example', label },
      { onStage: setStage },
    );
    handleResult(result);
  };

  const handleLoadFromGithub = async (path: string) => {
    startLoading(path);
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
    const result = await loadFromUrl(
      rawUrl,
      { type: 'github', label: `${repo}@${branch}/${path}` },
      { onStage: setStage },
    );
    handleResult(result);
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

  const resetSelection = () => {
    setDonorConfig(null);
    setDonorSource(null);
    setStage('idle');
    setValidationErrors(null);
    setErrorMessage(null);
    setSelectedNames(new Set());
    setLayerSearch('');
  };

  // ---- Loading view ----
  const renderLoadingView = () => {
    const order: DonorLoadStage[] = ['parse', 'normalize', 'validate', 'done'];
    const stageReached = (s: DonorLoadStage): boolean =>
      order.indexOf(stage) >= order.indexOf(s);
    const progressPct =
      stage === 'done'
        ? 100
        : stageReached('validate')
          ? 60
          : stageReached('normalize')
            ? 40
            : 20;

    const StageRow = ({ s, label }: { s: DonorLoadStage; label: string }) => {
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
      </div>
    );
  };

  // ---- Donor loaded view ----
  const handleToggleLeaf = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSelectVisible = (names: string[]) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      for (const n of names) next.add(n);
      return next;
    });
  };

  const handleClearAll = () => setSelectedNames(new Set());

  const handleImport = () => {
    const destination = {
      interfaceGroup: targetInterfaceGroup,
      subinterfaceGroup: targetSubinterfaceGroup,
    };
    const names = Array.from(selectedNames);
    // TODO: Step 4 — apply selected layers to the active configuration.
    console.info('[ImportLayer] step3 selection', { destination, names });
    onOpenChange(false);
  };

  const renderDonorLoadedView = () => {
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-3 mt-2">
        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{donorSource?.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Importing into{' '}
              <span className="font-medium text-foreground">
                {targetLabel || 'your configuration'}
              </span>
            </div>
          </div>
        </div>

        <DonorLayerTree
          donorConfig={donorConfig}
          selectedNames={selectedNames}
          onToggle={handleToggleLeaf}
          onSelectVisible={handleSelectVisible}
          onClearAll={handleClearAll}
          search={layerSearch}
          onSearchChange={setLayerSearch}
        />

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={resetSelection}>
            Choose a different config
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={selectedNames.size === 0}>
              Import {selectedNames.size > 0 ? `${selectedNames.size} layer${selectedNames.size === 1 ? '' : 's'}` : 'layers'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ---- Error banner ----
  const renderErrorBanner = () => {
    if (!validationErrors && !errorMessage) return null;
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-destructive">Could not load donor configuration</div>
            {errorMessage && (
              <div className="text-xs text-muted-foreground mt-1">{errorMessage}</div>
            )}
            {validationErrors && validationErrors.length > 0 && (
              <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside space-y-0.5 max-h-32 overflow-auto">
                {validationErrors.slice(0, 8).map((err, i) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">{err.field}:</span> {err.message}
                  </li>
                ))}
                {validationErrors.length > 8 && (
                  <li>…and {validationErrors.length - 8} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isLoading) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl h-[640px] max-h-[90vh] flex flex-col">
        <ModalErrorBoundary
          onClose={() => onOpenChange(false)}
          resetKey={open ? `${activeTab}:${isLoading ? 'loading' : donorConfig ? 'loaded' : 'idle'}` : 'closed'}
        >
          <DialogHeader>
            <DialogTitle>Import Layer Card</DialogTitle>
            <DialogDescription>
              {isLoading
                ? 'Loading donor configuration — please wait.'
                : donorConfig
                  ? `Configuration loaded. Ready to import into ${targetLabel || 'your configuration'}.`
                  : `Choose a configuration to import layer cards from${
                      targetLabel ? ` into ${targetLabel}` : ''
                    }.`}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            renderLoadingView()
          ) : donorConfig ? (
            renderDonorLoadedView()
          ) : (
            <>
              {renderErrorBanner()}
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
                      <p className="text-sm font-medium">Upload a donor configuration JSON file</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a <code>.json</code> file from your computer. Your current
                        configuration will not be replaced.
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
                    <button
                      onClick={() => handleLoadExample()}
                      className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-sm">Comprehensive demo</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            A production-ready configuration showcasing many layer types and
                            features.
                          </div>
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  </div>
                </TabsContent>

                {/* From GitHub */}
                <TabsContent
                  value="github"
                  className="mt-4 space-y-3 flex-1 min-h-0 flex flex-col"
                >
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditRepo}
                            title="Cancel"
                          >
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
                      <Select
                        value={branch}
                        onValueChange={setBranch}
                        disabled={branchesLoading}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={branchesLoading ? 'Loading…' : 'Select branch'}
                          />
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchTree(repo, branch)}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                    {!treeLoading && !treeError && filteredTree.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No <code>config.json</code> files found.
                      </div>
                    )}
                    {!treeLoading && !treeError && filteredTree.length > 0 && (
                      <ul className="divide-y divide-border">
                        {filteredTree.map((entry) => (
                          <li key={entry.path}>
                            <button
                              onClick={() => handleLoadFromGithub(entry.path)}
                              className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center gap-3"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm font-mono truncate flex-1">
                                {entry.path}
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-end gap-2 pt-2 mt-auto border-t border-border">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </ModalErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export default DonorConfigPickerDialog;
