
import React from 'react';

export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime?: number;
  updateTime?: number;
  propsChangeCount: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private renderTimes: Map<string, number> = new Map();

  startMeasure(componentName: string) {
    this.renderTimes.set(componentName, performance.now());
  }

  endMeasure(componentName: string, type: 'mount' | 'update' = 'update') {
    const startTime = this.renderTimes.get(componentName);
    if (!startTime) return;

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    const existing = this.metrics.get(componentName);
    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      propsChangeCount: existing ? existing.propsChangeCount + 1 : 1,
      timestamp: Date.now(),
      ...(type === 'mount' ? { mountTime: renderTime } : { updateTime: renderTime })
    };

    this.metrics.set(componentName, metrics);
    this.renderTimes.delete(componentName);

    // Log slow renders
    if (renderTime > 16) { // More than one frame
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  getMetrics(componentName?: string) {
    if (componentName) {
      return this.metrics.get(componentName);
    }
    return Array.from(this.metrics.values());
  }

  clearMetrics() {
    this.metrics.clear();
    this.renderTimes.clear();
  }

  getSlowComponents(threshold = 16): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .filter(metric => metric.renderTime > threshold)
      .sort((a, b) => b.renderTime - a.renderTime);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// HOC for performance monitoring
export const withPerformanceMonitoring = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName?: string
) => {
  const name = componentName || Component.displayName || Component.name || 'Anonymous';
  
  return React.memo((props: T) => {
    React.useEffect(() => {
      performanceMonitor.startMeasure(name);
      return () => performanceMonitor.endMeasure(name, 'mount');
    }, []);

    React.useEffect(() => {
      performanceMonitor.startMeasure(name);
      performanceMonitor.endMeasure(name, 'update');
    });

    return React.createElement(Component, props);
  });
};

// Hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    performanceMonitor.startMeasure(componentName);
    return () => performanceMonitor.endMeasure(componentName);
  });

  return {
    getMetrics: () => performanceMonitor.getMetrics(componentName),
    clearMetrics: () => performanceMonitor.clearMetrics()
  };
};
