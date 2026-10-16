import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Columns2, Download, Eye, Layers, Satellite, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfigImport } from '@/hooks/useConfigIO';
import { useToast } from '@/hooks/use-toast';
import { APP_TEMPLATES, AppTemplate, LOCATION_PRESETS } from '@/utils/appTemplates/templates';

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

type Action = 'builder' | 'preview' | 'download';

const TemplateDialog: React.FC<{ template: AppTemplate | null; onClose: () => void }> = ({ template, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { importConfigFromText } = useConfigImport();
  const [title, setTitle] = useState('');
  const [lon, setLon] = useState('0');
  const [lat, setLat] = useState('0');
  const [zoom, setZoom] = useState('2');
  const [dataUrl, setDataUrl] = useState('');
  const [busy, setBusy] = useState<Action | null>(null);

  useEffect(() => {
    if (!template) return;
    const d = template.defaults;
    setTitle(d.title);
    setLon(String(d.center[0]));
    setLat(String(d.center[1]));
    setZoom(String(d.zoom));
    setDataUrl(d.dataUrl);
  }, [template]);

  if (!template) return null;

  const params = () => ({
    title: title.trim() || template.defaults.title,
    center: [Number(lon) || 0, Number(lat) || 0] as [number, number],
    zoom: Math.min(20, Math.max(0, Number(zoom) || 0)),
    dataUrl: dataUrl.trim(),
  });

  const run = async (action: Action) => {
    const p = params();
    const config = template.build(p);
    const text = JSON.stringify(config, null, 2);
    if (action === 'download') {
      const blob = new Blob([text], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${config.exportPrefix || 'app'}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    setBusy(action);
    const result = await importConfigFromText(text, { type: 'example', label: `${template.name} app` });
    setBusy(null);
    if (!result.success) {
      toast({ title: 'Could not create app', description: 'The generated configuration failed validation.', variant: 'destructive' });
      return;
    }
    navigate(action === 'builder' ? '/' : '/preview');
  };

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-title">App title</Label>
            <Input id="app-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Focus area</Label>
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_PRESETS.map((l) => (
                <Button
                  key={l.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setLon(String(l.center[0]));
                    setLat(String(l.center[1]));
                    setZoom(String(l.zoom));
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input value={lon} onChange={(e) => setLon(e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input value={lat} onChange={(e) => setLat(e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Zoom</Label><Input value={zoom} onChange={(e) => setZoom(e.target.value)} /></div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-data">{template.dataLabel}</Label>
            <Input id="app-data" value={dataUrl} onChange={(e) => setDataUrl(e.target.value)} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">Pre-filled with sample data. Replace it with your own, or keep it to explore.</p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => run('download')}>
            <Download className="h-4 w-4 mr-1.5" /> Export JSON
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => run('preview')} disabled={!!busy}>
              <Eye className="h-4 w-4 mr-1.5" /> {busy === 'preview' ? 'Creating…' : 'Preview'}
            </Button>
            <Button onClick={() => run('builder')} disabled={!!busy}>
              <Wrench className="h-4 w-4 mr-1.5" /> {busy === 'builder' ? 'Creating…' : 'Open in Config Builder'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Apps: React.FC = () => {
  const [selected, setSelected] = useState<AppTemplate | null>(null);
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Geospatial Explorer Apps';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-tight">Geospatial Explorer <span className="text-primary">Apps</span></span>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">Advanced Config Builder →</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        <section className="space-y-3 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">What do you want to explore?</h1>
          <p className="text-lg text-muted-foreground">
            Start from a ready-made app, set your area and data, and get a complete Geospatial Explorer configuration in seconds.
          </p>
        </section>

        <section className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Build with AI</h2>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your app, e.g. Monitor crop health around Bristol through summer 2025 using Sentinel-2"
            className="min-h-20"
          />
          <div className="flex flex-wrap items-center gap-2">
            {PROMPT_IDEAS.map((idea) => (
              <Button key={idea} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPrompt(idea)}>
                {idea}
              </Button>
            ))}
            <Button
              className="ml-auto"
              disabled={!prompt.trim()}
              onClick={() => toast({ title: 'Build with AI is coming soon', description: 'For now, start from one of the templates below.' })}
            >
              Generate app <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Start from a template</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {APP_TEMPLATES.map((t) => {
              const Icon = ICONS[t.id] ?? Layers;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
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
          </div>
        </section>
      </main>

      <TemplateDialog template={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Apps;
