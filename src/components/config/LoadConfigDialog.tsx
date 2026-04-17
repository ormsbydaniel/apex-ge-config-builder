import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Github, Loader2, Search, AlertCircle, ChevronRight, Check, X } from 'lucide-react';
import { useConfigImport } from '@/hooks/useConfigIO';
import { ValidationErrorDetails } from '@/types/config';

const DEFAULT_REPO = 'ESA-APEx/apex_geospatial_explorer_configs';
const DEFAULT_BRANCH = 'main';

interface LoadConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: (errors: ValidationErrorDetails[], fileName: string) => void;
}

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

const LoadConfigDialog = ({ open, onOpenChange, onError }: LoadConfigDialogProps) => {
  const { importConfig, importConfigFromUrl } = useConfigImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<string>('upload');
  const [isLoadingExample, setIsLoadingExample] = useState(false);

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
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [isEditingRepo, setIsEditingRepo] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setActiveTab('upload');
      setSearch('');
    }
  }, [open]);

  // Fetch branches when repo changes (and GitHub tab is/has been opened)
  const fetchBranches = async (targetRepo: string) => {
    setBranchesLoading(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${targetRepo}/branches?per_page=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const names: string[] = data.map((b: any) => b.name);
      setBranches(names.length ? names : [DEFAULT_BRANCH]);
      // Pick default branch if available, otherwise first
      if (names.includes(DEFAULT_BRANCH)) {
        setBranch(DEFAULT_BRANCH);
      } else if (names.length) {
        setBranch(names[0]);
      }
    } catch (e: any) {
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
        `https://api.github.com/repos/${targetRepo}/git/trees/${targetBranch}?recursive=1`
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

  // When user enters GitHub tab the first time, or repo/branch changes, fetch
  useEffect(() => {
    if (!open || activeTab !== 'github') return;
    fetchBranches(repo);
  }, [open, activeTab, repo]);

  useEffect(() => {
    if (!open || activeTab !== 'github') return;
    if (!branch) return;
    fetchTree(repo, branch);
  }, [open, activeTab, repo, branch]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await importConfig(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!result.success && result.errors) {
      onOpenChange(false);
      onError(result.errors, file.name);
    } else if (result.success) {
      onOpenChange(false);
    }
  };

  const handleLoadExample = async (exampleName?: string) => {
    setIsLoadingExample(true);
    const result = await importConfigFromUrl('/examples/test-config.json', {
      type: 'example',
      label: exampleName || 'Comprehensive demo',
    });
    setIsLoadingExample(false);
    if (!result.success && result.errors) {
      onOpenChange(false);
      onError(result.errors, 'test-config.json');
    } else if (result.success) {
      onOpenChange(false);
    }
  };

  const handleLoadFromGithub = async (path: string) => {
    setLoadingPath(path);
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
    const result = await importConfigFromUrl(rawUrl, {
      type: 'github',
      label: `${repo}@${branch}/${path}`,
    });
    setLoadingPath(null);
    if (!result.success && result.errors) {
      onOpenChange(false);
      onError(result.errors, path);
    } else if (result.success) {
      onOpenChange(false);
    }
  };

  const applyRepo = () => {
    const trimmed = repoInput.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
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

  const filteredTree = tree.filter((e) =>
    !search.trim() || e.path.toLowerCase().includes(search.toLowerCase())
  );

  const examples = [
    {
      name: 'Comprehensive demo',
      description: 'A production-ready configuration showcasing many layer types and features.',
      url: '/examples/test-config.json',
      fileName: 'test-config.json',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Configuration</DialogTitle>
          <DialogDescription>
            Choose a source to load a configuration from.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
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
                  disabled={isLoadingExample}
                  className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ex.description}</div>
                    </div>
                    {isLoadingExample ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
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
                  <label className="text-xs font-medium text-muted-foreground">Repository (owner/name)</label>
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
                      <SelectItem key={b} value={b}>{b}</SelectItem>
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
                    const isLoading = loadingPath === entry.path;
                    return (
                      <li key={entry.path}>
                        <button
                          onClick={() => handleLoadFromGithub(entry.path)}
                          disabled={loadingPath !== null}
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{folder}</div>
                            <div className="text-xs text-muted-foreground truncate">{entry.path}</div>
                          </div>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
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
      </DialogContent>
    </Dialog>
  );
};

export default LoadConfigDialog;
