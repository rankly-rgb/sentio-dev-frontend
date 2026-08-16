import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/productionLogger';
import { TrialExpiredError } from '@/lib/fetchWithUserJwt';
import { captureRenderError } from '@/lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  correlationId: string | null;
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export default class ErrorBoundary extends Component<Props, State> {
  private redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, correlationId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, correlationId: generateCorrelationId() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Incident 2026-08-13: a render error here previously left the user with
    // "An error occurred" and nothing else — no trace, no context, no way to
    // report it. correlationId ties what the user sees to this exact log line.
    logger.error('ErrorBoundary', 'Caught render error', {
      correlationId: this.state.correlationId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Même erreur, même correlationId : la ligne de log ci-dessus, le code
    // affiché à l'utilisateur et l'événement Sentry se rejoignent. No-op
    // sans DSN configuré.
    captureRenderError(error, errorInfo.componentStack, this.state.correlationId);

    if (this.isSessionError(error)) {
      this.redirectTimeout = setTimeout(() => {
        window.location.href = '/login?reason=session_error';
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  private isSessionError(error: Error | null): boolean {
    if (!error) return false;
    // TrialExpiredError's message contains "expired" too — a real trial
    // expiry must never be misdiagnosed as a session expiry and silently
    // redirect to /login (see TrialExpiredState for the correct handling,
    // which normally intercepts this before it ever reaches the boundary).
    if (error instanceof TrialExpiredError) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('session') || msg.includes('jwt') ||
           msg.includes('expired') || msg.includes('token');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, correlationId: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isSession = this.isSessionError(this.state.error);

      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md p-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              {isSession ? 'Session expired' : 'An error occurred'}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {isSession
                ? 'Your session has expired. You will be redirected to the login page.'
                : 'An unexpected error occurred. Try refreshing the page.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-48 mb-4">
                {this.state.error.message}
              </pre>
            )}
            {this.state.correlationId && (
              <p className="text-xs text-muted-foreground mb-4">
                Error ID: <code className="font-mono">{this.state.correlationId}</code>
                {' — include this if you report the issue.'}
              </p>
            )}
            {isSession ? (
              <p className="text-sm text-muted-foreground">
                Redirecting...
              </p>
            ) : (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80"
                >
                  Retry
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  Refresh page
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
