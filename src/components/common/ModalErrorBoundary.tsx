import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ModalErrorBoundaryProps {
  children: React.ReactNode;
  /** Called when the user clicks "Close" in the fallback UI. Should dismiss the modal. */
  onClose?: () => void;
  /**
   * When this value changes, the boundary clears any captured error and re-renders children.
   * Pass something tied to the modal's identity / open state (e.g. `isOpen ? id : 'closed'`).
   */
  resetKey?: unknown;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Render-phase error boundary scoped to a single modal/dialog.
 *
 * Catches exceptions thrown during render of dialog content (hook order
 * violations, undefined property access, malformed third-party data) and
 * shows an inline fallback inside the dialog instead of letting the error
 * bubble up and unmount the entire app.
 *
 * Does NOT catch errors in event handlers or async callbacks — those
 * should continue to use try/catch + toasts.
 */
export class ModalErrorBoundary extends React.Component<
  ModalErrorBoundaryProps,
  ModalErrorBoundaryState
> {
  constructor(props: ModalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Modal error boundary caught:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ModalErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleClose = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onClose?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Something went wrong in this dialog</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {error?.message || 'An unexpected error occurred while rendering this dialog.'}
          </p>
        </div>
        {isDev && error?.stack && (
          <details className="w-full max-w-md text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Details (dev only)
            </summary>
            <pre className="mt-2 text-[11px] bg-muted p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Try again
          </Button>
          {this.props.onClose && (
            <Button size="sm" onClick={this.handleClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }
}

export default ModalErrorBoundary;
