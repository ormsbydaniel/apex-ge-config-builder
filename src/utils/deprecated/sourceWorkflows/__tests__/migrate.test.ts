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
    const input = {
      sources: [{ name: 'A', workflows: [{ serviceId: 'a1' }] }],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    migrateSourceWorkflowsToTopLevel(input);
    expect(input).toEqual(snapshot);
  });
});
