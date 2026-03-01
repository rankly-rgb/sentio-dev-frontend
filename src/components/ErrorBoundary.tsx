import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    // Session-related errors: redirect to login after brief delay
    if (this.isSessionError(error)) {
      setTimeout(() => {
        window.location.href = '/login?reason=session_error';
      }, 2000);
    }
  }

  private isSessionError(error: Error | null): boolean {
    if (!error) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('session') || msg.includes('jwt') ||
           msg.includes('expired') || msg.includes('token');
  }

  private handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isSession = this.isSessionError(this.state.error);

      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md p-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              {isSession ? 'Session Expired' : 'Something went wrong'}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {isSession
                ? 'Your session has expired. You will be redirected to login shortly.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-48 mb-4">
                {this.state.error.message}
              </pre>
            )}
            {isSession ? (
              <p className="text-sm text-muted-foreground">
                Redirecting to login...
              </p>
            ) : (
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Refresh Page
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
