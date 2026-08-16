// ============================================================
// Sentry — Pièce 3 de l'infrastructure de fin de chantier
// ============================================================
//
// Trois usages, pas un de plus : erreurs frontend, tag de l'organisation
// touchée, et rien d'autre. Pas de performance monitoring, pas de session
// replay, pas de règle d'alerte sophistiquée — c'est explicitement hors
// périmètre, et l'ajouter ouvrirait un chantier observabilité.
//
// Zero-PII : `sendDefaultPii: false` empêche Sentry d'attacher IP et
// identité de l'utilisateur. Le seul identifiant transmis est
// `organization_id`, déjà un identifiant interne opaque — jamais d'email,
// de nom ni de téléphone, conformément à la règle du projet.
//
// Sans `VITE_SENTRY_DSN` (dev local, preview sans variable), toutes les
// fonctions de ce module sont des no-op silencieux : le développement ne
// dépend jamais de Sentry, et rien ne part vers un projet distant depuis
// une machine de dev.

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

/** True quand un DSN est configuré — sinon tout ce module ne fait rien. */
export function isSentryEnabled(): boolean {
  return typeof DSN === 'string' && DSN.length > 0;
}

/**
 * À appeler une seule fois, avant le rendu React.
 */
export function initSentry(): void {
  if (!isSentryEnabled()) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE, // "production" / "development"
    sendDefaultPii: false,
    tracesSampleRate: 0, // erreurs uniquement — pas de traces de performance
  });
}

/**
 * Associe les erreurs suivantes à une organisation.
 *
 * C'est ce qui transforme « une erreur quelque part » en « ces N
 * organisations sont touchées » — le chiffre qui manquait pendant
 * l'incident 402.
 */
export function setSentryOrganization(organizationId: string | null): void {
  if (!isSentryEnabled()) return;
  Sentry.setTag('org_id', organizationId ?? 'none');
}

/**
 * Remonte une erreur de rendu React capturée par l'ErrorBoundary.
 *
 * `correlationId` est l'identifiant déjà affiché à l'utilisateur sur
 * l'écran de repli et déjà écrit dans les logs applicatifs : le poser en
 * tag permet de relier ce que l'utilisateur signale, la ligne de log, et
 * l'événement Sentry — sans avoir à demander autre chose qu'un code court.
 */
export function captureRenderError(
  error: Error,
  componentStack: string | null | undefined,
  correlationId: string | null,
): void {
  if (!isSentryEnabled()) return;

  Sentry.withScope((scope) => {
    if (correlationId) scope.setTag('correlation_id', correlationId);
    if (componentStack) {
      scope.setContext('react', { componentStack });
    }
    Sentry.captureException(error);
  });
}
