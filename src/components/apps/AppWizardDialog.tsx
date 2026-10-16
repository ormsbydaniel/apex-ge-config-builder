import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Eye, Loader2, Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfigImport } from '@/hooks/useConfigIO';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AppTemplate,
  DataInsight,
  WizardField,
  WizardOption,
  FINAL_TWEAKS_STEP,
  LOCATION_PRESETS,
  WizardStep,
  WizardValues,
  getDefaultValues,
  isFieldVisible,
  validateStep,
} from '@/utils/appTemplates/templates';
import { AppWizardDraft, saveWizardDraft } from '@/utils/appTemplates/wizardDraft';
import { Bbox, pointInBbox } from '@/utils/appTemplates/dataProbes';
import LocationPickerMap from './LocationPickerMap';

type Action = 'builder' | 'preview' | 'download';
const STEP_LABELS = ['Title', 'Data', 'Location', 'Options', 'Final tweaks'];
const S_DATA = 1;
const S_LOCATION = 2;
const S_OPTIONS = 3;
const S_FINAL = 4;

const fieldOptions = (f: WizardField, insight: DataInsight | null): WizardOption[] | undefined =>
  (insight && f.optionsFrom?.(insight)) || f.options;

const bboxView = (b: Bbox): { center: [number, number]; zoom: number } => {
  const w = Math.max(b[2] - b[0], (b[3] - b[1]) * 2, 0.01);
  const zoom = Math.max(1, Math.min(14, Math.floor(Math.log2(360 / w)) + 1));
  return { center: [Number(((b[0] + b[2]) / 2).toFixed(4)), Number(((b[1] + b[3]) / 2).toFixed(4))], zoom };
};

const StepFields: React.FC<{
  step: WizardStep;
  values: WizardValues;
  insight: DataInsight | null;
  onChange: (id: string, v: string) => void;
}> = ({ step, values, insight, onChange }) => (
  <div className="space-y-4">
    {step.fields.filter((f) => isFieldVisible(f, values)).map((f) => (
      <div key={f.id} className="space-y-1.5">
        <Label htmlFor={`wiz-${f.id}`}>{f.label}</Label>
        {(() => {
          const opts = fieldOptions(f, insight);
          if (!opts?.length || (f.type !== 'choice' && !f.optionsFrom)) return null;
          if (f.type === 'choice' && opts.length <= 12) return null;
          return (
            <Select value={values[f.id] || undefined} onValueChange={(v) => onChange(f.id, v)}>
              <SelectTrigger id={`wiz-${f.id}`}><SelectValue placeholder="Choose…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {opts.map((o) => (
                  <SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })()}
        {(() => {
          const opts = fieldOptions(f, insight);
          return (f.type !== 'choice' && f.optionsFrom && opts?.length) || (f.type === 'choice' && opts && opts.length > 12);
        })() ? null : f.type === 'choice' ? (
          <div className={cn('grid gap-2', fieldOptions(f, insight)!.some((o) => o.description) ? 'grid-cols-1' : 'grid-cols-4')}>
            {fieldOptions(f, insight)!.map((o) => {
              const active = values[f.id] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  title={o.disabled ? 'Outside the dates this data covers' : undefined}
                  onClick={() => onChange(f.id, o.value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    active ? 'border-primary bg-primary/10' : 'hover:border-primary/50',
                    o.disabled && 'cursor-not-allowed opacity-40 hover:border-border',
                  )}
                >
                  <span className="font-medium">{o.label}</span>
                  {o.description && <span className="block text-xs text-muted-foreground">{o.description}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            id={`wiz-${f.id}`}
            type={f.type === 'date' ? 'date' : 'text'}
            value={values[f.id] ?? ''}
            placeholder={f.placeholder}
            min={insight && f.rangeFrom ? f.rangeFrom(insight).min : undefined}
            max={insight && f.rangeFrom ? f.rangeFrom(insight).max : undefined}
            onChange={(e) => onChange(f.id, e.target.value)}
            className={f.type === 'text' ? 'font-mono text-xs' : undefined}
          />
        )}
        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
      </div>
    ))}
  </div>
);

const AppWizardDialog: React.FC<{ template: AppTemplate | null; draft?: AppWizardDraft | null; onClose: () => void }> = ({
  template,
  draft,
  onClose,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { importConfigFromText } = useConfigImport();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [zoom, setZoom] = useState(2);
  const [preset, setPreset] = useState<string | null>(null);
  const [values, setValues] = useState<WizardValues>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);

  const [maxVisited, setMaxVisited] = useState(0);
  const [insight, setInsight] = useState<DataInsight | null>(null);
  const [probing, setProbing] = useState(false);
  const [liveNote, setLiveNote] = useState<string | null>(null);
  const probeSeq = useRef(0);

  useEffect(() => {
    if (!template) return;
    const resume = draft && draft.templateId === template.id ? draft : null;
    setStep(resume ? Math.min(resume.step, STEP_LABELS.length - 1) : 0);
    setMaxVisited(resume ? STEP_LABELS.length - 1 : 0);
    setTitle(resume?.title ?? template.defaults.title);
    setCenter(resume?.center ?? template.defaults.center);
    setZoom(resume?.zoom ?? template.defaults.zoom);
    setPreset(null);
    setValues({ ...getDefaultValues(template), ...(resume?.values ?? {}) });
    setError(null);
    setInsight(null);
    setLiveNote(null);
  }, [template, draft]);

  // Ask the chosen data what it offers (debounced; probes are cached per URL).
  useEffect(() => {
    if (!template?.probe) return;
    const t = setTimeout(() => {
      const req = template.probe!(values);
      const seq = ++probeSeq.current;
      if (!req) {
        setInsight(null);
        setProbing(false);
        return;
      }
      setProbing(true);
      req.then((res) => {
        if (seq !== probeSeq.current) return;
        setInsight(res);
        setProbing(false);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [template, values]);

  // Live check on the options step (e.g. matching scene count).
  useEffect(() => {
    if (!template?.liveCheck || step !== S_OPTIONS) return;
    let alive = true;
    setLiveNote('Checking data…');
    const t = setTimeout(() => {
      template.liveCheck!({ title, center, zoom, values }).then((n) => alive && setLiveNote(n));
    }, 600);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, step, values, center, zoom]);

  if (!template) return null;

  const isLast = step === STEP_LABELS.length - 1;
  const currentWizardStep = step === S_DATA ? template.dataStep : step === S_OPTIONS ? template.optionsStep : step === S_FINAL ? FINAL_TWEAKS_STEP : null;

  const problemFor = (i: number): string | null => {
    if (i === 0) return title.trim() ? null : 'Please give your app a title.';
    if (i === S_DATA) return validateStep(template.dataStep, values);
    if (i === S_OPTIONS) return validateStep(template.optionsStep, values);
    return null;
  };

  const ready = maxVisited >= STEP_LABELS.length - 1 && STEP_LABELS.every((_, i) => !problemFor(i));

  const goTo = (target: number) => {
    if (target === step) return;
    if (target > step) {
      // Moving forward: every step before the target must be valid.
      for (let i = step; i < target; i++) {
        const p = problemFor(i);
        if (p) {
          setStep(i);
          setError(p);
          return;
        }
      }
    }
    setError(null);
    setStep(target);
    setMaxVisited((m) => Math.max(m, target));
  };

  const next = () => goTo(step + 1);

  const run = async (action: Action) => {
    const bad = STEP_LABELS.findIndex((_, i) => problemFor(i));
    if (bad >= 0) {
      setStep(bad);
      setError(problemFor(bad));
      return;
    }
    const config = template.build({ title: title.trim(), center, zoom, values });
    saveWizardDraft({ templateId: template.id, title: title.trim(), center, zoom, values, step });
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
    navigate(action === 'builder' ? '/' : '/preview', { state: action === 'preview' ? { fromApps: true } : undefined });
  };

  const groups = Array.from(new Set(LOCATION_PRESETS.map((l) => l.group)));

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.tagline}</DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs">
          {STEP_LABELS.map((l, i) => (
            <li key={l} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(i)}
                className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                    i !== step && i <= maxVisited && 'border-primary bg-primary text-primary-foreground',
                    i === step && 'border-primary text-primary',
                    i > maxVisited && i !== step && 'text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span className={cn(i === step ? 'font-medium' : 'text-muted-foreground')}>{l}</span>
              </button>
              {i < STEP_LABELS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="min-h-[24rem] space-y-4 py-2">
          {step === 0 && (
            <div className="space-y-1.5">
              <h3 className="font-semibold">Name your app</h3>
              <p className="text-sm text-muted-foreground">This appears in the app's header. You can change it later.</p>
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                className="mt-2"
              />
            </div>
          )}

          {step === S_LOCATION && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Where should the app start?</h3>
                <p className="text-sm text-muted-foreground">Pick a place, or move the map so the circle sits where you want.</p>
              </div>
              <div className="space-y-1.5">
                {insight?.bbox && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-20 text-xs text-muted-foreground">Data</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={preset === '__data' ? 'default' : 'outline'}
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const v = bboxView(insight.bbox!);
                        setPreset('__data');
                        setCenter(v.center);
                        setZoom(v.zoom);
                      }}
                    >
                      Fit to data area
                    </Button>
                  </div>
                )}
                {groups.map((g) => (
                  <div key={g} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-20 text-xs text-muted-foreground">{g}</span>
                    {LOCATION_PRESETS.filter((l) => l.group === g).map((l) => (
                      <Button
                        key={l.label}
                        type="button"
                        size="sm"
                        variant={preset === l.label ? 'default' : 'outline'}
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setPreset(l.label);
                          setCenter(l.center);
                          setZoom(l.zoom);
                        }}
                      >
                        {l.label}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
              <LocationPickerMap
                center={center}
                zoom={zoom}
                dataBbox={insight?.bbox}
                onChange={(c, z) => {
                  setCenter((prev) => {
                    if (Math.abs(prev[0] - c[0]) > 1e-3 || Math.abs(prev[1] - c[1]) > 1e-3) setPreset(null);
                    return c;
                  });
                  setZoom(z);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Centre {center[1].toFixed(3)}, {center[0].toFixed(3)} · zoom {zoom}
              </p>
              {insight?.bbox && !pointInBbox(center, insight.bbox) && (
                <p className="text-xs text-destructive">This place is outside the area the data covers (outlined on the map).</p>
              )}
            </div>
          )}

          {currentWizardStep && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{currentWizardStep.title}</h3>
                <p className="text-sm text-muted-foreground">{currentWizardStep.description}</p>
              </div>
              <StepFields
                step={currentWizardStep}
                values={values}
                insight={insight}
                onChange={(id, v) => {
                  setValues((prev) => ({ ...prev, [id]: v }));
                  setError(null);
                }}
              />
            </div>
          )}

          {(step === S_DATA || step === S_OPTIONS) && template.probe && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {probing ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Checking data…</>
              ) : insight?.failed ? (
                "Couldn't check the service, so the standard choices are shown."
              ) : insight?.temporalExtent ? (
                `Data available ${insight.temporalExtent[0] ?? '…'} to ${insight.temporalExtent[1] ?? 'today'}.`
              ) : insight?.years?.length ? (
                `Years available: ${insight.years.join(', ')}.`
              ) : insight?.layers?.length ? (
                `${insight.layers.length} layers found in this service.`
              ) : insight?.bbox ? (
                'Data area found; you can fit the map to it in the Location step.'
              ) : null}
            </p>
          )}
          {step === S_OPTIONS && liveNote && <p className="text-xs text-muted-foreground">{liveNote}</p>}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? onClose() : (setError(null), setStep((s) => s - 1)))}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => run('download')} disabled={!ready || !!busy}>
              <Download className="mr-1.5 h-4 w-4" /> Export JSON
            </Button>
            <Button variant="outline" onClick={() => run('builder')} disabled={!ready || !!busy}>
              <Wrench className="mr-1.5 h-4 w-4" /> {busy === 'builder' ? 'Creating…' : 'Config Builder'}
            </Button>
            <Button variant={isLast ? 'default' : 'outline'} onClick={() => run('preview')} disabled={!ready || !!busy}>
              <Eye className="mr-1.5 h-4 w-4" /> {busy === 'preview' ? 'Creating…' : 'Launch preview'}
            </Button>
            {!isLast && (
              <Button onClick={next}>
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppWizardDialog;
