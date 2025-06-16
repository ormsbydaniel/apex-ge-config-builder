
import React from 'react';

export interface ComponentConfig {
  name: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  dependencies?: string[];
}

export interface ComposedComponentProps {
  components: ComponentConfig[];
  sharedProps?: Record<string, any>;
  layout?: 'stack' | 'grid' | 'flex';
}

export const createComposedComponent = (config: ComposedComponentProps) => {
  return React.memo(({ children, ...props }: any) => {
    const { components, sharedProps = {}, layout = 'stack' } = config;
    
    const layoutClass = {
      stack: 'space-y-4',
      grid: 'grid gap-4',
      flex: 'flex gap-4'
    }[layout];

    const mergedProps = { ...sharedProps, ...props };

    return React.createElement(
      'div',
      { className: layoutClass },
      ...components.map((componentConfig, index) => {
        const Component = componentConfig.component;
        const componentProps = {
          ...mergedProps,
          ...componentConfig.props
        };
        
        return React.createElement(
          Component,
          {
            key: componentConfig.name || index,
            ...componentProps
          }
        );
      }),
      children
    );
  });
};

export const withComposition = <T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  compositionConfig: Partial<ComposedComponentProps> = {}
) => {
  return React.memo((props: T) => {
    const ComposedComponent = createComposedComponent({
      components: [],
      ...compositionConfig
    });
    
    return React.createElement(
      ComposedComponent,
      props,
      React.createElement(WrappedComponent, props)
    );
  });
};

// Advanced composition utilities for Phase 3
export interface AdvancedCompositionConfig<T = any> {
  components: ComponentConfig[];
  middleware?: Array<(props: T) => T>;
  errorBoundary?: React.ComponentType<{ children: React.ReactNode; error?: Error }>;
  loading?: React.ComponentType;
  fallback?: React.ComponentType;
}

export const createAdvancedComposition = <T extends Record<string, any>>(
  config: AdvancedCompositionConfig<T>
) => {
  return React.memo((props: T) => {
    const { components, middleware = [], errorBoundary: ErrorBoundary, loading: Loading, fallback: Fallback } = config;
    
    // Apply middleware transformations
    const processedProps = middleware.reduce((acc, transform) => transform(acc), props);
    
    const renderComponents = () => {
      return components.map((componentConfig, index) => {
        const Component = componentConfig.component;
        const componentProps = {
          ...processedProps,
          ...componentConfig.props
        };
        
        return React.createElement(
          Component,
          {
            key: componentConfig.name || index,
            ...componentProps
          }
        );
      });
    };

    if (ErrorBoundary) {
      return React.createElement(
        ErrorBoundary,
        { children: React.createElement(React.Fragment, {}, ...renderComponents()) }
      );
    }

    return React.createElement(React.Fragment, {}, ...renderComponents());
  });
};

// Performance optimization utilities
export const memoizeComponentConfig = (config: ComponentConfig): ComponentConfig => {
  return {
    ...config,
    component: React.memo(config.component)
  };
};

export const optimizeComposition = (configs: ComponentConfig[]): ComponentConfig[] => {
  return configs.map(memoizeComponentConfig);
};
