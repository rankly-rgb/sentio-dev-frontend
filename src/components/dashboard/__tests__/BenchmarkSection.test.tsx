import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BenchmarkSection } from '../BenchmarkSection';
import type { BenchmarkResponse } from '@/lib/types/benchmark';

function makeBenchmarkData(overrides?: Partial<BenchmarkResponse>): BenchmarkResponse {
  return {
    computed_at: '2026-03-16T10:00:00Z',
    period_days: 30,
    metrics: {
      nrr: {
        value: 112.3,
        external_benchmark: {
          excellent: 110,
          bon: 100,
          correct: 95,
          mediocre: 85,
          rating: 'excellent',
          sources: ['OpenView Partners', 'SaaS Capital'],
        },
        peer: {
          available: true,
          median: 105.2,
          org_count: 12,
          delta: 7.1,
        },
      },
      churn_rate: {
        value: 1.8,
        external_benchmark: {
          excellent: 1,
          bon: 2,
          correct: 3.5,
          mediocre: 5,
          rating: 'bon',
          sources: ['Bessemer'],
        },
        peer: {
          available: true,
          median: 2.4,
          org_count: 12,
          delta: -0.6,
        },
      },
      mrr_growth: {
        value: 8.2,
        external_benchmark: {
          excellent: 10,
          bon: 7,
          correct: 4,
          mediocre: 1,
          rating: 'bon',
          sources: ['KeyBanc'],
        },
        peer: {
          available: false,
          median: null,
          org_count: null,
          delta: null,
        },
      },
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

  it('shows peer unavailable message when peer.available is false', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    expect(
      screen.getByText('Données pairs disponibles à partir de 3 organisations'),
    ).toBeInTheDocument();
  });

  it('inverts delta color on churn_rate (negative delta = green)', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    // churn_rate delta is -0.6 → negative → should be green (emerald) because lower churn is good
    const churnDelta = screen.getByText(/-0,6/);
    const parent = churnDelta.closest('span');
    expect(parent?.className).toContain('text-emerald-600');
  });

  it('shows positive delta as green for NRR', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    // NRR delta is +7.1 → positive → green
    const nrrDelta = screen.getByText(/\+7,1/);
    const parent = nrrDelta.closest('span');
    expect(parent?.className).toContain('text-emerald-600');
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

  it('displays benchmark sources', () => {
    const data = makeBenchmarkData();
    render(<BenchmarkSection data={data} />);

    expect(screen.getByText(/OpenView Partners/)).toBeInTheDocument();
    expect(screen.getByText(/Bessemer/)).toBeInTheDocument();
  });

  it('displays error state when error is provided', () => {
    render(<BenchmarkSection data={null} error={new Error('Erreur 500')} />);

    expect(screen.getByText('Benchmarks indisponibles')).toBeInTheDocument();
    expect(screen.getByText(/Impossible de charger/)).toBeInTheDocument();
  });
});
