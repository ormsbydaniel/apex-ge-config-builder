import type { WizardValues } from './templates';

/** Wizard answers kept for the session so authors can return from Preview and refine. */
export interface AppWizardDraft {
  templateId: string;
  title: string;
  center: [number, number];
  zoom: number;
  values: WizardValues;
  step: number;
}

const KEY = 'apex-app-wizard-draft';

export const saveWizardDraft = (draft: AppWizardDraft) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable: refinement simply starts fresh */
  }
};

export const loadWizardDraft = (): AppWizardDraft | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppWizardDraft) : null;
  } catch {
    return null;
  }
};
