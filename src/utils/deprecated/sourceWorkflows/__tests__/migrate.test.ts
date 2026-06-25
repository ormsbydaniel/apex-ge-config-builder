import { describe, it, expect } from 'vitest';
import { migrateSourceWorkflowsToTopLevel } from '../migrate';

describe('migrateSourceWorkflowsToTopLevel', () => {
  it('no-ops when no sources carry workflows', () => {
    const input = {
      workflows: [{ serviceId: 'top', serviceProvider: 'vito' }],
      sources: [{ name: 'A' }, { name: 'B' }],
    };
    const { config, movedCount } = migrateSourceWorkflowsToTopLevel(input);
    expect(movedCount).toBe(0);
    expect(config.workflows).toEqual(input.workflows);
    expect(config.sources).toEqual(input.sources);
  });

  it('hoists per-source workflows in source order and strips the field', () => {
    const input: any = {
      sources: [

        { name: 'A', workflows: [{ serviceId: 'a1', serviceProvider: 'vito' }] },
        { name: 'B' },
        {
          name: 'C',
          workflows: [
            { serviceId: 'c1', serviceProvider: 'eurac' },
            { serviceId: 'c2', serviceProvider: 'eurac' },
          ],
        },
      ],
    };
    const { config, movedCount } = migrateSourceWorkflowsToTopLevel(input);
    expect(movedCount).toBe(3);
    expect(config.workflows?.map((w) => w.serviceId)).toEqual(['a1', 'c1', 'c2']);
    expect(config.sources?.every((s: any) => !('workflows' in s))).toBe(true);
  });

  it('does not mutate the input', () => {
    const input: any = {

      sources: [{ name: 'A', workflows: [{ serviceId: 'a1' }] }],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    migrateSourceWorkflowsToTopLevel(input);
    expect(input).toEqual(snapshot);
  });

  it('hoisted workflows inherit parent meta/layout with workflow overrides winning', () => {
    const input: any = {
      sources: [
        {
          name: 'A',
          meta: {
            description: 'parent description',
            attribution: { text: 'Parent attr' },
            units: 'm',
          },
          layout: {
            layerCard: { legend: { type: 'swatch' }, toggleable: true },
          },
          workflows: [
            { serviceId: 'a1', serviceProvider: 'vito' },
            {
              serviceId: 'a2',
              serviceProvider: 'vito',
              meta: { description: 'override' },
            },
          ],
        },
      ],
    };
    const { config } = migrateSourceWorkflowsToTopLevel(input);
    const [w1, w2] = config.workflows!;
    expect((w1 as any).meta.description).toBe('parent description');
    expect((w1 as any).meta.attribution.text).toBe('Parent attr');
    expect((w1 as any).meta.units).toBe('m');
    expect((w1 as any).layout.layerCard.legend.type).toBe('swatch');
    expect((w1 as any).layout.layerCard.toggleable).toBe(true);
    // Workflow overrides parent
    expect((w2 as any).meta.description).toBe('override');
    expect((w2 as any).meta.attribution.text).toBe('Parent attr');
  });
});
