import { createContext, useContext, type ReactNode } from 'react';
import { useDraftAutosave } from '@/hooks/useDraftAutosave';
import { Button } from '@/components/ui/button';

interface DraftStatusValue {
  savedAt: string | null;
  discardDraft: () => Promise<void>;
}

const DraftStatusContext = createContext<DraftStatusValue>({
  savedAt: null,
  discardDraft: async () => {},
});

export function useDraftStatus(): DraftStatusValue {
  return useContext(DraftStatusContext);
}

export function formatDraftTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Autosave and the other-tab warning. A saved session is restored without asking. */
const DraftPersistence = ({ children }: { children: ReactNode }) => {
  const draft = useDraftAutosave();

  return (
    <DraftStatusContext.Provider value={{ savedAt: draft.savedAt, discardDraft: draft.discardDraft }}>
      {draft.otherTab && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm">
          <span>This config was edited in another tab.</span>
          <Button type="button" size="sm" variant="outline" onClick={draft.loadTheirs}>Load that version</Button>
          <Button type="button" size="sm" variant="outline" onClick={draft.keepMine}>Keep this tab</Button>
        </div>
      )}
      {children}
    </DraftStatusContext.Provider>
  );
};

export default DraftPersistence;
