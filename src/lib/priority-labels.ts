/**
 * Mapping centralisé des codes priorité backend (P0/P1/P2) vers labels métier FR.
 * Le code technique reste dans les payloads API et query params.
 * Seul l'affichage change côté frontend.
 */

export type PriorityCode = 'P0' | 'P1' | 'P2';

interface PriorityConfig {
  label: string;
  variant: 'destructive' | 'warning' | 'secondary';
}

const PRIORITY_MAP: Record<PriorityCode, PriorityConfig> = {
  P0: { label: 'Urgent', variant: 'destructive' },
  P1: { label: 'Watch', variant: 'warning' },
  P2: { label: 'Stable', variant: 'secondary' },
};

/** Tous les codes priorité dans l'ordre de sévérité */
export const PRIORITY_CODES: PriorityCode[] = ['P0', 'P1', 'P2'];

/** Retourne le label FR lisible pour un code priorité backend */
export function getPriorityLabel(code: PriorityCode): string {
  return PRIORITY_MAP[code].label;
}

/** Retourne la variante de badge (destructive | warning | secondary) */
export function getPriorityVariant(code: PriorityCode): PriorityConfig['variant'] {
  return PRIORITY_MAP[code].variant;
}

/** Mapping complet exporté pour les filtres/selects */
export const PRIORITY_OPTIONS: ReadonlyArray<{ code: PriorityCode; label: string; variant: PriorityConfig['variant'] }> =
  PRIORITY_CODES.map(code => ({
    code,
    label: PRIORITY_MAP[code].label,
    variant: PRIORITY_MAP[code].variant,
  }));

/** Tente de convertir un string en PriorityCode, retourne le label si valide, sinon la valeur brute */
export function formatPriorityKey(key: string): string {
  if (key in PRIORITY_MAP) {
    return PRIORITY_MAP[key as PriorityCode].label;
  }
  return key;
}
