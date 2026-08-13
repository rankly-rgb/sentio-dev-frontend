import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { TrialExpiredError } from '@/lib/fetchWithUserJwt';

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
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('shows session expired message for session-related errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="JWT session expired" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Session expired')).toBeInTheDocument();
    expect(screen.getByText(/redirected/)).toBeInTheDocument();
  });

  it('shows retry and reload buttons for non-session errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Network failure" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Refresh page')).toBeInTheDocument();
  });

  it('shows a correlation ID on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Something broke" />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('does not treat TrialExpiredError as a session error, even though its message contains "expired"', () => {
    function ThrowTrialExpired(): ReactNode {
      throw new TrialExpiredError();
    }
    render(
      <ErrorBoundary>
        <ThrowTrialExpired />
      </ErrorBoundary>,
    );
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.queryByText('Session expired')).not.toBeInTheDocument();
  });

  it('resets error state when clicking Retry', () => {
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

    expect(screen.getByText('An error occurred')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Retry'));

    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
