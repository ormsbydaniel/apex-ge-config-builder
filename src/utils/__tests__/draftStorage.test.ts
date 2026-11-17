import { describe, expect, it } from 'vitest';
import { configReducer, initialState } from '@/contexts/ConfigContext';
import {
  DRAFT_MAX_AGE_MS,
  buildDraftEnvelope,
  createMemoryStore,
  deleteDraft,
  migrateEnvelope,
  parseDraft,
  pickDraftState,
  saveDraft,
  shouldKeepDraft,
} from '@/utils/draftStorage';

describe('draft persistence', () => {
  it('keeps a draft after export and after a file load, and drops it on reset', () => {
    const edited = { ...initialState, isDirty: true, lastLoaded: null, lastExported: null };
    expect(shouldKeepDraft(edited)).toBe(true);

    const exported = { ...initialState, isDirty: false, lastExported: new Date(), lastLoaded: null };
    expect(shouldKeepDraft(exported)).toBe(true);

    const loaded = { ...initialState, isDirty: false, lastLoaded: new Date(), lastExported: null };
    expect(shouldKeepDraft(loaded)).toBe(true);

    const reset = { ...initialState, isDirty: false, lastLoaded: null, lastExported: null };
    expect(shouldKeepDraft(reset)).toBe(false);
  });

  it('round-trips dates and leaves transient fields out of the envelope', () => {
    const exportedAt = new Date('2026-11-11T10:00:00.000Z');
    const state = {
      ...initialState,
      isDirty: false,
      lastExported: exportedAt,
      lastLoaded: null,
      validationResults: new Map([[0, { valid: true }]]),
      env: { KEYCLOAK_URL: 'https://auth.example' },
    };
    const picked = pickDraftState(state as any);
    expect(picked.lastExported).toBe(exportedAt.toISOString());
    expect(picked).not.toHaveProperty('validationResults');
    expect(picked).not.toHaveProperty('env');
    expect(picked.sources).toEqual(initialState.sources);

    const envelope = buildDraftEnvelope(picked, '/preview', 'tab-1', exportedAt);
    const text = JSON.stringify(envelope);
    const read = parseDraft(text, exportedAt.getTime());
    expect(read.status).toBe('ok');
    if (read.status === 'ok') {
      expect(read.envelope.state.lastExported).toBe(exportedAt.toISOString());
      expect(read.envelope.route).toBe('/preview');
    }
  });

  it('migrates a schemaVersion 0 envelope', () => {
    const migrated = migrateEnvelope({
      schemaVersion: 0,
      savedAt: '2026-01-01T00:00:00.000Z',
      config: { version: '1.2.0', sources: [] },
      isDirty: true,
    });
    expect(migrated?.schemaVersion).toBe(1);
    expect(migrated?.state.version).toBe('1.2.0');
    expect(migrated?.state.isDirty).toBe(true);
  });

  it('treats damaged JSON as corrupt and old copies as too old', () => {
    expect(parseDraft('not-json').status).toBe('corrupt');
    expect(parseDraft(JSON.stringify({ schemaVersion: 99 })).status).toBe('corrupt');

    const old = buildDraftEnvelope(
      pickDraftState({ ...initialState, isDirty: true } as any),
      '/',
      'tab',
      new Date(Date.now() - DRAFT_MAX_AGE_MS - 1000),
    );
    expect(parseDraft(JSON.stringify(old)).status).toBe('too-old');
  });

  it('replaces the stored draft on write and removes it only on delete', async () => {
    const store = createMemoryStore();
    const first = buildDraftEnvelope(
      { ...pickDraftState(initialState), isDirty: true, version: '1' },
      '/',
      'tab',
    );
    await saveDraft(first, store);
    const second = buildDraftEnvelope(
      { ...pickDraftState({ ...initialState, version: '2' } as any), isDirty: false, lastExported: '2026-11-11T00:00:00.000Z' },
      '/',
      'tab',
    );
    await saveDraft(second, store);
    const kept = parseDraft(await store.get('draft'));
    expect(kept.status).toBe('ok');
    if (kept.status === 'ok') expect(kept.envelope.state.version).toBe('2');

    await deleteDraft(store);
    expect(parseDraft(await store.get('draft')).status).toBe('empty');
  });

  it('restores a draft with its saved unsaved flag instead of clearing it', () => {
    const restored = configReducer(initialState, {
      type: 'RESTORE_DRAFT',
      payload: {
        ...initialState,
        version: '9.9.9',
        isDirty: false,
        lastExported: '2026-11-11T12:00:00.000Z',
        lastLoaded: null,
        layout: { navigation: { title: 'Restored title', logo: '' } },
      },
    });
    expect(restored.version).toBe('9.9.9');
    expect(restored.layout.navigation.title).toBe('Restored title');
    expect(restored.isDirty).toBe(false);
    expect(restored.lastExported?.toISOString()).toBe('2026-11-11T12:00:00.000Z');
    expect(restored.validationResults).toBeInstanceOf(Map);
  });

  it('marks a restored dirty draft as unsaved', () => {
    const restored = configReducer(initialState, {
      type: 'RESTORE_DRAFT',
      payload: { ...initialState, isDirty: true },
    });
    expect(restored.isDirty).toBe(true);
  });
});
