import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import ErrorBoundary from '../ErrorBoundary';

// Suppress console.error from React's error boundary logging
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

function ThrowError({ message }: { message: string }): ReactNode {
  if (message) throw new Error(message);
  return null;
}

function GoodChild() {
  return <div>Everything is fine</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Everything is fine')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Something broke" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
  });

  it('shows session expired message for session-related errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="JWT session expired" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Session expirée')).toBeInTheDocument();
    expect(screen.getByText(/redirigé/)).toBeInTheDocument();
  });

  it('shows retry and reload buttons for non-session errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Network failure" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Réessayer')).toBeInTheDocument();
    expect(screen.getByText('Rafraîchir la page')).toBeInTheDocument();
  });

  it('resets error state when clicking Réessayer', () => {
    let shouldThrow = true;
    function MaybeThrow(): ReactNode {
      if (shouldThrow) throw new Error('fail');
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Réessayer'));

    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
