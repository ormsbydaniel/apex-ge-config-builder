
import { ComponentConfig, ComposedComponentProps } from './componentComposition';

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

export const createTestComponentConfig = (
  name: string,
  overrides: Partial<ComponentConfig> = {}
): ComponentConfig => ({
  name,
  component: createMockComponent(name),
  props: { testProp: `test-${name}` },
  ...overrides
});

export const createTestCompositionConfig = (
  componentCount = 3,
  overrides: Partial<ComposedComponentProps> = {}
): ComposedComponentProps => ({
  components: Array.from({ length: componentCount }, (_, i) =>
    createTestComponentConfig(`TestComponent${i + 1}`)
  ),
  sharedProps: { shared: 'test-value' },
  layout: 'stack',
  ...overrides
});

// Validation helpers
export const validateComponentConfig = (config: ComponentConfig): string[] => {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('Component config must have a name');
  }

  if (!config.component) {
    errors.push('Component config must have a component');
  }

  if (config.dependencies?.includes(config.name)) {
    errors.push('Component cannot depend on itself');
  }

  return errors;
};

export const validateCompositionConfig = (config: ComposedComponentProps): string[] => {
  const errors: string[] = [];

  if (!config.components || config.components.length === 0) {
    errors.push('Composition must have at least one component');
  }

  config.components?.forEach((componentConfig, index) => {
    const componentErrors = validateComponentConfig(componentConfig);
    errors.push(...componentErrors.map(error => `Component ${index}: ${error}`));
  });

  // Check for circular dependencies
  const componentNames = config.components?.map(c => c.name) || [];
  config.components?.forEach(component => {
    component.dependencies?.forEach(dep => {
      if (!componentNames.includes(dep)) {
        errors.push(`Component ${component.name} has unknown dependency: ${dep}`);
      }
    });
  });

  return errors;
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
