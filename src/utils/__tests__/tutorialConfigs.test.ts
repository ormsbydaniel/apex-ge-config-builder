import { describe, expect, it } from 'vitest';
import { parseTutorialListing } from '../tutorialConfigs';

describe('parseTutorialListing', () => {
  it('labels, filters and sorts tutorial files', () => {
    const out = parseTutorialListing([
      { name: 'tutorial-10-completion.json', type: 'file', download_url: 'https://x/10c' },
      { name: 'README.md', type: 'file' },
      { name: 'tutorial-3-completion.json', type: 'file' },
      { name: 'tutorial-3-prerequisite.json', type: 'file' },
      { name: 'tutorial-4-prerequisite.json', type: 'dir' },
    ]);
    expect(out.map((e) => e.name)).toEqual([
      'Tutorial 3 prerequisite',
      'Tutorial 3 completion',
      'Tutorial 10 completion',
    ]);
    expect(out[2].url).toBe('https://x/10c');
    expect(out[0].url).toContain('/tutorials/tutorial-3-prerequisite.json');
  });

  it('uses the latest dated file for each tutorial and kind', () => {
    const out = parseTutorialListing([
      { name: 'tutorial-3-completion.json', type: 'file', download_url: 'https://x/undated' },
      { name: 'tutorial-3-completion_20261006_0900.json', type: 'file', download_url: 'https://x/older' },
      { name: 'tutorial-3-completion_20261007_1558.json', type: 'file', download_url: 'https://x/latest' },
      { name: 'tutorial-3-prerequisite_20261007_1600.json', type: 'file', download_url: 'https://x/prerequisite' },
    ]);

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      name: 'Tutorial 3 prerequisite',
      url: 'https://x/prerequisite',
      fileName: 'tutorial-3-prerequisite_20261007_1600.json',
      updatedAt: '2026-10-07T16:00:00.000Z',
    });
    expect(out[1]).toMatchObject({
      name: 'Tutorial 3 completion',
      url: 'https://x/latest',
      fileName: 'tutorial-3-completion_20261007_1558.json',
      updatedAt: '2026-10-07T15:58:00.000Z',
    });
    expect(out[1].description).toContain('Last updated 7 Oct 2026, 15:58 UTC');
  });

  it('names known tutorials with their topic title', () => {
    const out = parseTutorialListing([
      { name: 'tutorial-10-prerequisite_20261012_0832.json', type: 'file' },
      { name: 'tutorial-10-completion_20261012_0832.json', type: 'file' },
      { name: 'tutorial-12-completion.json', type: 'file' },
    ]);

    expect(out.map((e) => e.name)).toEqual([
      'Tutorial 10 – Vector data (prerequisite)',
      'Tutorial 10 – Vector data (completion)',
      'Tutorial 12 – STAC as a data source (completion)',
    ]);
    expect(out[0].description).toContain('Starting point for Tutorial 10 – Vector data');
  });

  it('falls back to a plain label for tutorials without a title', () => {
    const out = parseTutorialListing([
      { name: 'tutorial-13-completion.json', type: 'file' },
    ]);

    expect(out[0].name).toBe('Tutorial 13 completion');
    expect(out[0].description).toBe('Finished result of Tutorial 13');
  });

  it('falls back to undated files and ignores invalid timestamps', () => {
    const out = parseTutorialListing([
      { name: 'tutorial-4-completion.json', type: 'file' },
      { name: 'tutorial-4-completion_20261340_2561.json', type: 'file' },
      { name: 'tutorial-4-completion_20261007.json', type: 'file' },
    ]);

    expect(out).toHaveLength(1);
    expect(out[0].fileName).toBe('tutorial-4-completion.json');
    expect(out[0].description).toBe('Finished result of Tutorial 4');
    expect(out[0].updatedAt).toBeUndefined();
  });
});
