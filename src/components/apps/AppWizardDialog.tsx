import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Eye, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfigImport } from '@/hooks/useConfigIO';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AppTemplate,
  LOCATION_PRESETS,
  WizardStep,
  WizardValues,
  getDefaultValues,
  isFieldVisible,
  validateStep,
} from '@/utils/appTemplates/templates';
import LocationPickerMap from './LocationPickerMap';

type Action = 'builder' | 'preview' | 'download';
const STEP_LABELS = ['Title', 'Location', 'Options', 'Data'];

const StepFields: React.FC<{ step: WizardStep; values: WizardValues; onChange: (id: string, v: string) => void }> = ({ step, values, onChange }) => (
  <div className="space-y-4">
    {step.fields.filter((f) => isFieldVisible(f, values)).map((f) => (
      <div key={f.id} className="space-y-1.5">
        <Label htmlFor={`wiz-${f.id}`}>{f.label}</Label>
        {f.type === 'choice' ? (
          <div className={cn('grid gap-2', f.options!.some((o) => o.description) ? 'grid-cols-1' : 'grid-cols-4')}>
            {f.options!.map((o) => {
              const active = values[f.id] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange(f.id, o.value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    active ? 'border-primary bg-primary/10' : 'hover:border-primary/50',
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
            onChange={(e) => onChange(f.id, e.target.value)}
            className={f.type === 'text' ? 'font-mono text-xs' : undefined}
          />
        )}
        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
      </div>
    ))}
  </div>
);

const AppWizardDialog: React.FC<{ template: AppTemplate | null; onClose: () => void }> = ({ template, onClose }) => {
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

  useEffect(() => {
    if (!template) return;
    setStep(0);
    setTitle(template.defaults.title);
    setCenter(template.defaults.center);
    setZoom(template.defaults.zoom);
    setPreset(null);
    setValues(getDefaultValues(template));
    setError(null);
  }, [template]);

  if (!template) return null;

  const isLast = step === STEP_LABELS.length - 1;
  const currentWizardStep = step === 2 ? template.optionsStep : step === 3 ? template.dataStep : null;

  const check = (): boolean => {
    let problem: string | null = null;
    if (step === 0 && !title.trim()) problem = 'Please give your app a title.';
    if (currentWizardStep) problem = validateStep(currentWizardStep, values);
    setError(problem);
    return !problem;
  };

  const next = () => check() && setStep((s) => s + 1);

  const run = async (action: Action) => {
    if (!check()) return;
    const config = template.build({ title: title.trim(), center, zoom, values });
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

  const groups = Array.from(new Set(LOCATION_PRESETS.map((l) => l.group)));

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.tagline}</DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs">
          {STEP_LABELS.map((l, i) => (
            <li key={l} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                  i < step && 'border-primary bg-primary text-primary-foreground',
                  i === step && 'border-primary text-primary',
                  i > step && 'text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span className={cn(i === step ? 'font-medium' : 'text-muted-foreground')}>{l}</span>
              {i < STEP_LABELS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="min-h-64 space-y-4 py-2">
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

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Where should the app start?</h3>
                <p className="text-sm text-muted-foreground">Pick a place, or move the map so the circle sits where you want.</p>
              </div>
              <div className="space-y-1.5">
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
                onChange={(id, v) => {
                  setValues((prev) => ({ ...prev, [id]: v }));
                  setError(null);
                }}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? onClose() : (setError(null), setStep((s) => s - 1)))}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {isLast ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => run('download')}>
                <Download className="mr-1.5 h-4 w-4" /> Export JSON
              </Button>
              <Button variant="outline" onClick={() => run('builder')} disabled={!!busy}>
                <Wrench className="mr-1.5 h-4 w-4" /> {busy === 'builder' ? 'Creating…' : 'Config Builder'}
              </Button>
              <Button onClick={() => run('preview')} disabled={!!busy}>
                <Eye className="mr-1.5 h-4 w-4" /> {busy === 'preview' ? 'Creating…' : 'Launch preview'}
              </Button>
            </div>
          ) : (
            <Button onClick={next}>
              Next <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppWizardDialog;
