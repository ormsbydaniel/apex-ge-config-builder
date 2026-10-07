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
});
