type Flush = () => Promise<void>;

let flushImpl: Flush | null = null;

/** The autosave hook registers the flush used before a Keycloak redirect. */
export function registerDraftFlush(fn: Flush): () => void {
  flushImpl = fn;
  return () => {
    if (flushImpl === fn) flushImpl = null;
  };
}

export function flushDraftNow(): Promise<void> {
  return flushImpl ? flushImpl() : Promise.resolve();
}
