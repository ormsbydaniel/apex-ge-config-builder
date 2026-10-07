import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetTutorialCache, fetchTutorialConfigs, getTutorialConfigText } from '../tutorialConfigs';

let listing: Array<{ name: string; type: string; download_url: string }>;
const fetchMock = vi.fn(async (url: string) => {
  if (url.includes('api.github.com')) return new Response(JSON.stringify(listing), { status: 200 });
  return new Response(`{"from":"${url}"}`, { status: 200 });
});

const file = (name: string) => ({ name, type: 'file', download_url: `https://x/${name}` });

describe('tutorial session cache', () => {
  beforeEach(() => {
    __resetTutorialCache();
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    listing = [file('tutorial-3-completion_20261007_1558.json')];
  });
  afterEach(() => vi.unstubAllGlobals());

  it('re-reads the listing each time but keeps unchanged entries', async () => {
    const a = await fetchTutorialConfigs();
    const b = await fetchTutorialConfigs();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(b[0]).toBe(a[0]);
  });

  it('downloads file content once per file name and refreshes on a newer date stamp', async () => {
    const [first] = await fetchTutorialConfigs();
    await getTutorialConfigText(first);
    await getTutorialConfigText(first);
    expect(fetchMock.mock.calls.filter(([u]) => !String(u).includes('api.github.com'))).toHaveLength(1);

    listing = [file('tutorial-3-completion_20261007_1558.json'), file('tutorial-3-completion_20261008_0900.json')];
    const [newer] = await fetchTutorialConfigs();
    expect(newer).not.toBe(first);
    expect(newer.fileName).toBe('tutorial-3-completion_20261008_0900.json');
    expect(await getTutorialConfigText(newer)).toContain('20261008_0900');
    expect(fetchMock.mock.calls.filter(([u]) => !String(u).includes('api.github.com'))).toHaveLength(2);
  });
});
