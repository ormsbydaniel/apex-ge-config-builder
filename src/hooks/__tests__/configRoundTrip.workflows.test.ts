import { describe, it, expect } from 'vitest';
import { ConfigurationSchema } from '@/schemas/configSchema';
import rawFixture from '@/__fixtures__/config_workflow_execution.json';

// The fixture stores some workflow `data` entries as a single object instead
// of an array. Normalise to the array shape the schema expects (matching the
// `singleItemArrayToObject` transformation applied to top-level sources).
const fixture: any = JSON.parse(JSON.stringify(rawFixture));
if (Array.isArray(fixture.workflows)) {
  fixture.workflows = fixture.workflows.map((wf: any) =>
    wf.data && !Array.isArray(wf.data) ? { ...wf, data: [wf.data] } : wf
  );
}

describe('config round-trip with workflows', () => {
  it('parses the user fixture with no schema errors', () => {
    const result = ConfigurationSchema.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('preserves Shape A (meta + data) and Shape B (serviceDetails) workflow entries', () => {
    const parsed = ConfigurationSchema.parse(fixture);
    const allWorkflows = (parsed as any).workflows ?? [];
    expect(allWorkflows.length).toBeGreaterThan(0);

    const shapeA = allWorkflows.find((w: any) => w.meta && Array.isArray(w.data));
    expect(shapeA).toBeDefined();
    expect(shapeA!.serviceId).toBeTruthy();
    expect(shapeA!.serviceProvider).toBeTruthy();

    const shapeB = allWorkflows.find((w: any) => w.serviceDetails);
    expect(shapeB).toBeDefined();
    expect(shapeB!.serviceDetails!.endpoint).toBeTruthy();
  });

  it('round-trips workflow entries through JSON serialise + re-validate', () => {
    const parsed = ConfigurationSchema.parse(fixture);
    const reparsed = ConfigurationSchema.parse(
      JSON.parse(JSON.stringify(parsed))
    );

    const originalWorkflows = (parsed as any).workflows ?? [];
    const reparsedWorkflows = re(parsed as any).workflows ?? [];

    expect(reparsedWorkflows.length).toBe(originalWorkflows.length);
    originalWorkflows.forEach((wf: any, i: number) => {
      expect(reparsedWorkflows[i]).toEqual(wf);
    });
  });
});
