/**
 * Retourne le nom d'affichage d'un compte.
 * Priorité : display_name → stripe_customer_id masqué
 * Zero-PII : jamais d'email, jamais de nom de personne physique.
 */
export function getAccountLabel(account: {
  display_name?: string | null;
  stripe_customer_id?: string | null;
}): string {
  if (account.display_name?.trim()) {
    return account.display_name.trim();
  }
  if (account.stripe_customer_id) {
    const id = account.stripe_customer_id;
    return `cus_***${id.slice(-3)}`;
  }
  return 'Compte inconnu';
}

/**
 * Retourne les initiales pour un avatar.
 * Ex: "Acme Corp" → "AC", fallback → "?"
 */
export function getAccountInitials(account: {
  display_name?: string | null;
  stripe_customer_id?: string | null;
}): string {
  const label = getAccountLabel(account);
  if (label.startsWith('cus_') || label === 'Compte inconnu') return '?';
  return label
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
