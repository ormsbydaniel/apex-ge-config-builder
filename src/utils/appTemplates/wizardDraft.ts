import type { WizardValues } from './templates';

/** Wizard answers kept for the session so authors can return from Preview and refine. */
export interface AppWizardDraft {
  templateId: string;
  title: string;
  center: [number, number];
  zoom: number;
  values: WizardValues;
  step: number;
  /** 2 = data-first step order (Title, Data, Location, Options, Final tweaks). */
  version?: number;
}

const V1_TO_V2_STEP = [0, 2, 3, 1, 4];

/** Map a stored step index to the current data-first order. */
export const migrateDraftStep = (d: Pick<AppWizardDraft, 'step' | 'version'>): number =>
  d.version === 2 ? d.step : V1_TO_V2_STEP[d.step] ?? 0;

const KEY = 'apex-app-wizard-draft';

export const saveWizardDraft = (draft: AppWizardDraft) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, version: 2 }));
  } catch {
    /* storage unavailable: refinement simply starts fresh */
  }
};

export const loadWizardDraft = (): AppWizardDraft | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as AppWizardDraft;
    return { ...d, step: migrateDraftStep(d), version: 2 };
  } catch {
    return null;
  }
};
