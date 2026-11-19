import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const navigate = vi.fn();
let pathname = '/callback';
const authState = { ready: false };

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname, search: '', hash: '' }),
}));
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/contexts/ConfigContext', () => ({ useConfig: () => ({ config: {}, dispatch: vi.fn() }) }));
vi.mock('@/utils/draftFlush', () => ({ registerDraftFlush: () => () => {} }));
vi.mock('@/utils/viewerVersions', () => ({ saveViewerVersion: vi.fn() }));
vi.mock('@/utils/draftStorage', () => ({
  DRAFT_CHANNEL: 'x',
  DraftStorageError: class extends Error {},
  buildDraftEnvelope: vi.fn(),
  clearPendingRestore: vi.fn(),
  deleteDraft: vi.fn(async () => {}),
  getTabId: () => 't',
  pickDraftState: vi.fn(),
  readDraft: vi.fn(async () => ({ status: 'ok', envelope: { state: {}, savedAt: 'now' } })),
  readPendingRestore: () => ({ route: '/layers' }),
  saveDraft: vi.fn(async () => {}),
  saveDraftLocalSync: () => true,
  shouldKeepDraft: () => false,
}));

import { useDraftAutosave } from '../useDraftAutosave';

describe('draft restore after sign-in', () => {
  beforeEach(() => { navigate.mockReset(); authState.ready = false; });

  it('waits for sign-in to finish before leaving the callback page', async () => {
    pathname = '/callback';
    const { rerender } = renderHook(() => useDraftAutosave());
    await new Promise((r) => setTimeout(r, 20));
    expect(navigate).not.toHaveBeenCalled();
    authState.ready = true;
    rerender();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/layers', { replace: true }));
  });

  it('returns to the saved page immediately on other pages', async () => {
    pathname = '/';
    renderHook(() => useDraftAutosave());
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/layers', { replace: true }));
  });
});
