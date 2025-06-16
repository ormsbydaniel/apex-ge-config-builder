
// Test helpers for component testing and validation

export interface TestConfig {
  mockProps?: Record<string, any>;
  mockDependencies?: Record<string, any>;
  expectedBehavior?: {
    shouldRender: boolean;
    shouldThrow?: boolean;
    expectedProps?: Record<string, any>;
  };
}

export const createMockComponent = (name: string, returnValue?: any) => {
  const MockComponent = (props: any) => {
    return returnValue || `Mock${name}`;
  };
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

// Mock data generators
export const generateMockLayer = (id: string, overrides = {}) => ({
  name: `Test Layer ${id}`,
  description: `Test description for layer ${id}`,
  layout: { interfaceGroup: 'test-group' },
  meta: {
    attribution: { text: `Test Attribution ${id}`, url: 'https://test.com' },
    categories: ['test-category']
  },
  ...overrides
});

export const generateMockLayers = (count: number) =>
  Array.from({ length: count }, (_, i) => generateMockLayer((i + 1).toString()));

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  await renderFn();
  return performance.now() - start;
};

export const runPerformanceTest = async (
  testName: string,
  renderFn: () => void,
  iterations = 10
): Promise<{ average: number; min: number; max: number; total: number }> => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const time = await measureRenderTime(renderFn);
    times.push(time);
  }

  const total = times.reduce((sum, time) => sum + time, 0);
  const average = total / iterations;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`Performance Test: ${testName}`);
  console.log(`Average: ${average.toFixed(2)}ms`);
  console.log(`Min: ${min.toFixed(2)}ms`);
  console.log(`Max: ${max.toFixed(2)}ms`);
  console.log(`Total: ${total.toFixed(2)}ms`);

  return { average, min, max, total };
};
