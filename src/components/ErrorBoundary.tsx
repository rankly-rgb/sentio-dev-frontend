import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/productionLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  private redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary', 'Caught render error', { error: error.message, componentStack: errorInfo.componentStack });

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
    const msg = error.message.toLowerCase();
    return msg.includes('session') || msg.includes('jwt') ||
           msg.includes('expired') || msg.includes('token');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
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
              {isSession ? 'Session expirée' : 'Une erreur est survenue'}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {isSession
                ? 'Votre session a expiré. Vous allez être redirigé vers la page de connexion.'
                : 'Une erreur inattendue est survenue. Essayez de rafraîchir la page.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-48 mb-4">
                {this.state.error.message}
              </pre>
            )}
            {isSession ? (
              <p className="text-sm text-muted-foreground">
                Redirection en cours...
              </p>
            ) : (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80"
                >
                  Réessayer
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  Rafraîchir la page
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
