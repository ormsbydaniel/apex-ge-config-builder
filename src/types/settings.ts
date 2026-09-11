/**
 * Top-level application settings block in the configuration document.
 *
 * Mirrors `SettingsSchema` in `src/schemas/configSchema.ts`. Unknown keys are
 * preserved on a round trip, hence the index signature.
 */
export interface AppSettings {
  /** Timeout (ms) applied when the viewer fetches layer data. */
  layerFetchTimeoutMs?: number;
  [key: string]: unknown;
}
