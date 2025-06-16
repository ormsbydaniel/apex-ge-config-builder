
import React from 'react';
import { toast } from '@/hooks/use-toast';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorHandlerConfig {
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  showToast?: boolean;
  retryable?: boolean;
}

export class CompositionErrorBoundary extends React.Component<
  { children: React.ReactNode; config?: ErrorHandlerConfig },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; config?: ErrorHandlerConfig }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { config } = this.props;
    
    console.error('Composition Error:', error, errorInfo);
    
    if (config?.onError) {
      config.onError(error, errorInfo);
    }
    
    if (config?.showToast) {
      toast({
        title: "Component Error",
        description: error.message,
        variant: "destructive"
      });
    }
    
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, config } = this.props;

    if (hasError && error) {
      if (config?.fallback) {
        const FallbackComponent = config.fallback;
        return React.createElement(FallbackComponent, { 
          error, 
          retry: this.handleRetry 
        });
      }

      return React.createElement(
        'div',
        { className: 'p-4 border border-red-200 rounded-lg bg-red-50' },
        React.createElement(
          'h3',
          { className: 'text-red-800 font-semibold' },
          'Something went wrong'
        ),
        React.createElement(
          'p',
          { className: 'text-red-600 text-sm mt-2' },
          error.message
        ),
        config?.retryable && React.createElement(
          'button',
          {
            onClick: this.handleRetry,
            className: 'mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700'
          },
          'Try Again'
        )
      );
    }

    return children;
  }
}

export const withErrorBoundary = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  errorConfig?: ErrorHandlerConfig
) => {
  return React.memo((props: T) => 
    React.createElement(
      CompositionErrorBoundary,
      { 
        config: errorConfig,
        children: React.createElement(Component, props)
      }
    )
  );
};

// Async error handling for data operations
export const handleAsyncError = (error: unknown, context: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  console.error(`${context}:`, error);
  
  toast({
    title: "Operation Failed",
    description: errorMessage,
    variant: "destructive"
  });
};

export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    handleAsyncError(error, context);
    return fallback;
  }
};
