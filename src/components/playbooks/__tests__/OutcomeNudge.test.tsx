import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OutcomeNudge from '../OutcomeNudge';
import { en } from '@/i18n/en';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));

describe('OutcomeNudge', () => {
  it('renders the question and the three response options', () => {
    render(<OutcomeNudge onRespond={() => {}} />);

    expect(screen.getByText(en.playbooks.outcomeNudge.question)).toBeInTheDocument();
    expect(screen.getByText(en.playbooks.outcomeNudge.resolved)).toBeInTheDocument();
    expect(screen.getByText(en.playbooks.outcomeNudge.notResolved)).toBeInTheDocument();
    expect(screen.getByText(en.playbooks.outcomeNudge.unsure)).toBeInTheDocument();
  });

  it('calls onRespond with "resolved" when the Yes button is clicked', () => {
    const onRespond = vi.fn();
    render(<OutcomeNudge onRespond={onRespond} />);

    fireEvent.click(screen.getByText(en.playbooks.outcomeNudge.resolved));
    expect(onRespond).toHaveBeenCalledWith('resolved');
  });

  it('calls onRespond with "not_resolved" when the No button is clicked', () => {
    const onRespond = vi.fn();
    render(<OutcomeNudge onRespond={onRespond} />);

    fireEvent.click(screen.getByText(en.playbooks.outcomeNudge.notResolved));
    expect(onRespond).toHaveBeenCalledWith('not_resolved');
  });

  it('disables all response buttons while a submission is in flight', () => {
    render(<OutcomeNudge onRespond={() => {}} isSubmitting />);

    expect(screen.getByText(en.playbooks.outcomeNudge.resolved).closest('button')).toBeDisabled();
    expect(screen.getByText(en.playbooks.outcomeNudge.notResolved).closest('button')).toBeDisabled();
    expect(screen.getByText(en.playbooks.outcomeNudge.unsure).closest('button')).toBeDisabled();
  });
});
