import { describe, it, expect, vi } from 'vitest';
import { pickAttributeSource } from '../pickAttributeSource';

describe('pickAttributeSource', () => {
  it('skips files without attribute columns', async () => {
    const detect = vi.fn(async (url: string) => (url === 'c.fgb' ? [{ name: 'area', type: 'double' }] : []));
    const r = await pickAttributeSource(
      [{ url: 'a.fgb', format: 'flatgeobuf' }, { url: 'x', format: 'cog' }, { url: 'b.fgb', format: 'flatgeobuf' }, { url: 'c.fgb', format: 'flatgeobuf' }],
      detect,
    );
    expect(r?.url).toBe('c.fgb');
    expect(r?.inspected).toBe(3);
  });

  it('returns null when no file has attributes, and tolerates failures in multi-file layers', async () => {
    const detect = vi.fn(async (url: string) => { if (url === 'a.fgb') throw new Error('x'); return []; });
    expect(await pickAttributeSource([{ url: 'a.fgb', format: 'fgb' }, { url: 'b.fgb', format: 'fgb' }], detect)).toBeNull();
  });

  it('rethrows the error for a single unreachable file', async () => {
    const detect = vi.fn(async () => { throw new Error('Failed to fetch'); });
    await expect(pickAttributeSource([{ url: 'a.fgb', format: 'fgb' }], detect)).rejects.toThrow('Failed to fetch');
  });
});
