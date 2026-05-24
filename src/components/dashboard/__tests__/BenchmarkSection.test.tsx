import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BenchmarkSection } from '../BenchmarkSection';
import type { BenchmarkResponse } from '@/lib/types/benchmark';
import { fr } from '@/i18n/fr';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => fr }));

function makeBenchmarkData(overrides?: Partial<BenchmarkResponse>): BenchmarkResponse {
  return {
    nrr: {
      value: 112.3,
      rating: 'excellent',
      thresholds: { excellent: 110, bon: 100, correct: 95 },
      higher_is_better: true,
      sources: ['OpenView Partners', 'SaaS Capital'],
    },
    churn_rate: {
      value: 1.8,
      rating: 'bon',
      thresholds: { excellent: 1, bon: 2, correct: 3.5 },
      higher_is_better: false,
      sources: ['Bessemer'],
    },
    mrr_growth: {
      value: 8.2,
      rating: 'bon',
      thresholds: { excellent: 10, bon: 7, correct: 4 },
      higher_is_better: true,
      sources: ['KeyBanc'],
    },
    peers: {
      available: false,
      min_orgs_required: 3,
    },
    ...overrides,
  };
}

describe('BenchmarkSection', () => {
  it('renders 3 metric cards with valid data', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    expect(screen.getByText('Benchmarks sectoriels')).toBeInTheDocument();
    expect(screen.getByText('NRR')).toBeInTheDocument();
    expect(screen.getByText('Taux de churn')).toBeInTheDocument();
    expect(screen.getByText('Croissance MRR')).toBeInTheDocument();
  });

  it('shows "Excellent" badge in green for NRR rated excellent', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    const badges = screen.getAllByText('Excellent');
    expect(badges.length).toBeGreaterThanOrEqual(1);
    const badge = badges[0];
    expect(badge.className).toContain('bg-emerald-100');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('shows peer unavailable message when peers.available is false', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    expect(
      screen.getAllByText('Données pairs disponibles à partir de 3 organisations').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays benchmark sources', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    expect(screen.getByText(/OpenView Partners/)).toBeInTheDocument();
    expect(screen.getByText(/Bessemer/)).toBeInTheDocument();
  });

  it('renders skeleton when isLoading is true', () => {
    const { container } = render(<BenchmarkSection data={null} isLoading />);

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(3);
  });

  it('renders nothing when data is null and not loading', () => {
    const { container } = render(<BenchmarkSection data={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('displays error state when error is provided', () => {
    render(<BenchmarkSection data={null} error={new Error('Erreur 500')} />);

    expect(screen.getByText('Benchmarks indisponibles')).toBeInTheDocument();
    expect(screen.getByText(/Impossible de charger/)).toBeInTheDocument();
  });
});
