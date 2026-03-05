import { describe, it, expect } from 'vitest';
import { maskEmail } from '../settings';

describe('maskEmail', () => {
  it('masks a standard email', () => {
    expect(maskEmail('john@example.com')).toBe('j***@***.com');
  });

  it('returns fallback for empty string', () => {
    expect(maskEmail('')).toBe('***@***.***');
  });

  it('returns fallback for email without @', () => {
    expect(maskEmail('invalid')).toBe('***@***.***');
  });

  it('returns fallback for email with @ at position 0', () => {
    expect(maskEmail('@domain.com')).toBe('***@***.***');
  });

  it('handles domain without dot', () => {
    expect(maskEmail('a@localhost')).toBe('a***@***.***');
  });

  it('handles short local part', () => {
    expect(maskEmail('a@b.fr')).toBe('a***@***.fr');
  });

  it('preserves the TLD extension', () => {
    expect(maskEmail('test@company.co.uk')).toBe('t***@***.uk');
  });
});
