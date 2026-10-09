import { describe, it, expect } from 'vitest';
import { isManualTimestampRequired } from '../timestampRequirement';

describe('isManualTimestampRequired', () => {
  it('does not require a timestamp for STAC temporal sources', () => {
    expect(isManualTimestampRequired({ requiresTimestamp: true, format: 'stac', useTimeParameter: false })).toBe(false);
  });
  it('requires a timestamp for COG temporal sources', () => {
    expect(isManualTimestampRequired({ requiresTimestamp: true, format: 'cog', useTimeParameter: false })).toBe(true);
  });
  it('skips WMS using the TIME parameter', () => {
    expect(isManualTimestampRequired({ requiresTimestamp: true, format: 'wms', useTimeParameter: true })).toBe(false);
  });
  it('is never required for non-temporal layers', () => {
    expect(isManualTimestampRequired({ requiresTimestamp: false, format: 'cog', useTimeParameter: false })).toBe(false);
  });
});
