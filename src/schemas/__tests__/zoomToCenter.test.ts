import { describe, it, expect } from 'vitest';
import { ConfigurationSchema } from '@/schemas/configSchema';

const baseConfig = {
  layout: {
    navigation: { logo: '/logo.png', title: 'Test' },
  },
  interfaceGroups: ['Group A'],
  exclusivitySets: [],
  services: [],
  sources: [
    {
      name: 'Layer 1',
      isActive: true,
      data: [],
      meta: { description: '', attribution: { text: '' } },
      layout: {
        interfaceGroup: 'Group A',
        contentLocation: 'layerCard' as const,
        layerCard: {
          toggleable: true,
          controls: {
            opacitySlider: true,
            zoomToCenter: true,
          },
        },
      },
    },
  ],
};

describe('zoomToCenter schema', () => {
  it('accepts the legacy boolean form', () => {
    const result = ConfigurationSchema.safeParse(baseConfig);
    expect(result.success).toBe(true);
  });

  it('accepts the { extent: [...] } object form', () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.sources[0].layout.layerCard.controls.zoomToCenter = {
      extent: [0.0, 52, 1.0, 53.0],
    };
    const result = ConfigurationSchema.safeParse(cfg);
    expect(result.success).toBe(true);
    if (result.success) {
      const ctrl = result.data.sources[0].layout!.layerCard!.controls as any;
      expect(ctrl.zoomToCenter).toEqual({ extent: [0, 52, 1, 53] });
    }
  });

  it('rejects extent with wrong arity', () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.sources[0].layout.layerCard.controls.zoomToCenter = {
      extent: [0, 52, 1],
    };
    const result = ConfigurationSchema.safeParse(cfg);
    expect(result.success).toBe(false);
  });

  it('round-trips through JSON serialisation', () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.sources[0].layout.layerCard.controls.zoomToCenter = {
      extent: [0.0, 52, 1.0, 53.0],
    };
    const round = JSON.parse(JSON.stringify(cfg));
    const result = ConfigurationSchema.safeParse(round);
    expect(result.success).toBe(true);
    const ctrl = (result as any).data.sources[0].layout.layerCard.controls;
    expect(ctrl.zoomToCenter.extent).toEqual([0, 52, 1, 53]);
  });
});
