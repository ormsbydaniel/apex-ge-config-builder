import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Columns2, Layers, Satellite, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { APP_TEMPLATES, AppTemplate } from '@/utils/appTemplates/templates';
import { AppWizardDraft, loadWizardDraft } from '@/utils/appTemplates/wizardDraft';
import AppWizardDialog from '@/components/apps/AppWizardDialog';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'change-swipe': Columns2,
  'stac-monitor': Satellite,
  'vector-inspector': Layers,
};

const PROMPT_IDEAS = [
  'Wildfire burn scars in Attica, summer 2024',
  'Flood extent swipe map for the Somerset Levels',
  'Solar farm asset register for Spain',
];

const Apps: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AppTemplate | null>(null);
  const [draft, setDraft] = useState<AppWizardDraft | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Geospatial Explorer Apps';
  }, []);

  // Returning from Preview: reopen the wizard on its last step with the saved answers.
  useEffect(() => {
    if (!(location.state as { resumeWizard?: boolean } | null)?.resumeWizard) return;
    const saved = loadWizardDraft();
    const template = saved && APP_TEMPLATES.find((t) => t.id === saved.templateId);
    if (saved && template) {
      setDraft(saved);
      setSelected(template);
    }
    navigate('/apps', { replace: true, state: null });
  }, [location.state, navigate]);

  const openTemplate = (t: AppTemplate) => {
    setDraft(null);
    setSelected(t);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-tight">Geospatial Explorer <span className="text-primary">Apps</span></span>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">Advanced Config Builder →</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        <section className="space-y-3 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">What do you want to explore?</h1>
          <p className="text-lg text-muted-foreground">
            Pick a ready-made app and answer a few quick questions to get a complete Geospatial Explorer configuration.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Start from a template</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APP_TEMPLATES.map((t) => {
              const Icon = ICONS[t.id] ?? Layers;
              return (
                <button
                  key={t.id}
                  onClick={() => openTemplate(t)}
                  className="group text-left rounded-xl border bg-card p-5 space-y-3 transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.tagline}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.bestFor.map((b) => (
                      <Badge key={b} variant="outline" className="text-[10px] font-normal">{b}</Badge>
                    ))}
                  </div>
                  <span className="text-sm text-primary inline-flex items-center">
                    Use template <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setAiOpen(true)}
              className="group text-left rounded-xl border border-dashed bg-card p-5 space-y-3 transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">Build with AI <Badge variant="secondary" className="text-[10px]">Soon</Badge></h3>
                <p className="text-sm text-muted-foreground">Describe your app in plain words</p>
              </div>
              <span className="text-sm text-primary inline-flex items-center">
                Try it <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        </section>
      </main>

      <AppWizardDialog template={selected} draft={draft} onClose={() => setSelected(null)} />

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Build with AI</DialogTitle>
            <DialogDescription>Describe what you want to explore. This is coming soon — for now, use a template.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Monitor crop health around Bristol through summer 2025 using Sentinel-2"
            className="min-h-24"
          />
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_IDEAS.map((idea) => (
              <Button key={idea} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPrompt(idea)}>{idea}</Button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              disabled={!prompt.trim()}
              onClick={() => toast({ title: 'Build with AI is coming soon', description: 'For now, start from one of the templates.' })}
            >
              Generate app <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Apps;
