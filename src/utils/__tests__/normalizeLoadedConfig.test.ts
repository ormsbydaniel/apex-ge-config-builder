import { describe, expect, it, vi } from 'vitest';
import { normalizeLoadedConfig } from '../normalizeLoadedConfig';

describe('normalizeLoadedConfig link safety', () => {
  it('drops script URLs from attributions and footer links', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { config } = normalizeLoadedConfig({
      layout: {
        footer: [
          { title: 'Bad', url: 'javascript:alert(1)' },
          { title: 'Good', url: 'https://apex.esa.int' },
        ],
      },
      sources: [
        { name: 'a', meta: { attribution: { text: 'x', url: 'JavaScript:alert(1)' } }, data: [] },
        { name: 'b', meta: { attribution: { text: 'y', url: 'https://esa.int' } }, data: [] },
      ],
    });

    expect(config.layout.footer[0]).toEqual({ title: 'Bad' });
    expect(config.layout.footer[1].url).toBe('https://apex.esa.int');
    expect(config.sources[0].meta.attribution).toEqual({ text: 'x' });
    expect(config.sources[1].meta.attribution.url).toBe('https://esa.int');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('never carries an env block into the builder state', () => {
    const { config } = normalizeLoadedConfig({ env: { APEX_DISPATCHER_API_BASE_URL: 'evil.example' } });
    expect(config).not.toHaveProperty('env');
  });
});
