import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/auth/AuthContext';
import { registerDraftFlush } from '@/utils/draftFlush';
import { saveViewerVersion } from '@/utils/viewerVersions';
import {
  DRAFT_CHANNEL,
  DraftReadResult,
  DraftStorageError,
  buildDraftEnvelope,
  clearPendingRestore,
  deleteDraft,
  DraftEnvelope,
  getTabId,
  pickDraftState,
  readDraft,
  readPendingRestore,
  saveDraft,
  saveDraftLocalSync,
  shouldKeepDraft,
} from '@/utils/draftStorage';

const AUTOSAVE_DELAY_MS = 1000;

export function useDraftAutosave() {
  const { config, dispatch } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const routeRef = useRef('/');
  routeRef.current = `${location.pathname}${location.search}${location.hash}`;

  const [phase, setPhase] = useState<'checking' | 'ready'>('checking');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [otherTab, setOtherTab] = useState(false);
  const otherTabRef = useRef(false);
  const [storageHealthy, setStorageHealthy] = useState(true);
  const storageHealthyRef = useRef(true);
  const warnedRef = useRef(false);
  const tabIdRef = useRef(getTabId());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const skipImmediateRef = useRef(true);
  const discardHoldRef = useRef<object | null>(null);

  const noteFailure = useCallback((localOk: boolean) => {
    if (localOk) return;
    setStorageHealthy(false);
    storageHealthyRef.current = false;
    if (!warnedRef.current) {
      warnedRef.current = true;
      toast.error('Autosave unavailable, export to keep your work');
    }
  }, []);

  const writeCurrent = useCallback(async (force = false) => {
    if (phaseRef.current !== 'ready') return;
    if (otherTabRef.current && !force) return;
    if (!force && discardHoldRef.current === configRef.current) return;
    const current = configRef.current;
    if (!shouldKeepDraft(current)) {
      await deleteDraft();
      setSavedAt(null);
      return;
    }
    const envelope = buildDraftEnvelope(pickDraftState(current), routeRef.current, tabIdRef.current);
    const localOk = saveDraftLocalSync(envelope);
    try {
      await saveDraft(envelope);
      setSavedAt(envelope.savedAt);
      setStorageHealthy(true);
      storageHealthyRef.current = true;
      channelRef.current?.postMessage({ tabId: tabIdRef.current, savedAt: envelope.savedAt });
    } catch (error) {
      if (error instanceof DraftStorageError || !localOk) noteFailure(localOk);
      else if (localOk) setSavedAt(envelope.savedAt);
    }
  }, [noteFailure]);

  useEffect(() => registerDraftFlush(() => writeCurrent(true)), [writeCurrent]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const marker = readPendingRestore();
      const draft = await readDraft();
      if (cancelled) return;

      if (marker) clearPendingRestore();

      const envelope = restorableDraft(draft);
      if (envelope) {
        dispatch({ type: 'RESTORE_DRAFT', payload: envelope.state });
        setSavedAt(envelope.savedAt);
        if (marker?.previewVersion) saveViewerVersion(marker.previewVersion);
        if (marker?.route && marker.route !== routeRef.current) setPendingRoute(marker.route);
      } else if (draft.status === 'corrupt') {
        toast.error('The saved session could not be read');
      }
      setPhase('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);

  // Never leave the sign-in return page before Keycloak has read the code from the URL.
  const onCallback = location.pathname.endsWith('/callback');
  useEffect(() => {
    if (!pendingRoute) return;
    if (onCallback && !auth.ready) return;
    setPendingRoute(null);
    navigate(pendingRoute, { replace: true });
  }, [pendingRoute, onCallback, auth.ready, navigate]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const timer = window.setTimeout(() => {
      void writeCurrent(false);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [config, phase, writeCurrent]);

  const lastExportedTime = config.lastExported?.getTime() ?? null;
  const lastLoadedTime = config.lastLoaded?.getTime() ?? null;
  useEffect(() => {
    if (phase !== 'ready') return;
    if (skipImmediateRef.current) {
      skipImmediateRef.current = false;
      return;
    }
    void writeCurrent(false);
  }, [lastExportedTime, lastLoadedTime, phase, writeCurrent]);

  useEffect(() => {
    const flushHidden = () => {
      if (phaseRef.current !== 'ready' || otherTabRef.current) return;
      if (discardHoldRef.current === configRef.current) return;
      const current = configRef.current;
      if (!shouldKeepDraft(current)) return;
      const envelope = buildDraftEnvelope(pickDraftState(current), routeRef.current, tabIdRef.current);
      const localOk = saveDraftLocalSync(envelope);
      void saveDraft(envelope)
        .then(() => setSavedAt(envelope.savedAt))
        .catch(() => noteFailure(localOk));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushHidden();
    };
    const onUnload = (event: BeforeUnloadEvent) => {
      flushHidden();
      if (!storageHealthyRef.current && configRef.current.isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushHidden);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushHidden);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [noteFailure]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(DRAFT_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent) => {
      if (!event.data || event.data.tabId === tabIdRef.current) return;
      otherTabRef.current = true;
      setOtherTab(true);
    };
    return () => {
      channel.close();
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, []);

  const discardDraft = useCallback(async () => {
    discardHoldRef.current = configRef.current;
    await deleteDraft();
    setSavedAt(null);
  }, []);

  const keepMine = useCallback(() => {
    otherTabRef.current = false;
    setOtherTab(false);
    void writeCurrent(true);
  }, [writeCurrent]);

  const loadTheirs = useCallback(async () => {
    const draft = await readDraft();
    const envelope = restorableDraft(draft);
    if (envelope) {
      dispatch({ type: 'RESTORE_DRAFT', payload: envelope.state });
      setSavedAt(envelope.savedAt);
    }
    otherTabRef.current = false;
    setOtherTab(false);
  }, [dispatch]);

  return {
    savedAt,
    otherTab,
    storageHealthy,
    discardDraft,
    keepMine,
    loadTheirs,
  };
}

function restorableDraft(draft: DraftReadResult): DraftEnvelope | null {
  if (draft.status === 'ok' || draft.status === 'too-old') return draft.envelope;
  return null;
}
