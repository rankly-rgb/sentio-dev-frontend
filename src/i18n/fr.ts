export const fr = {
  // Navigation
  nav: {
    dashboard: "Vue d'ensemble",
    accounts: "Comptes clients",
    segments: "Segments",
    insights: "Insights IA",
    playbooks: "Playbooks",
    syncs: "Synchronisations",
    actions: "Actions",
    scoringRules: "Règles de scoring",
    mrrDashboard: "Tableau MRR",
    renewals: "Renouvellements",
    activityLogs: "Journaux d'activité",
    settings: "Paramètres",
    logout: "Se déconnecter",
  },

  // Dashboard
  dashboard: {
    title: "Vue d'ensemble rétention",
    mrr: "MRR",
    arr: "ARR",
    nrr: "NRR",
    logoRetention: "Rétention logo",
    activeAccounts: "Comptes actifs",
    accountsAtRisk: "Comptes à risque",
    mrrAtRisk: "MRR à risque",
    expansionOpportunities: "Opportunités d'expansion",
    avgHealthScore: "Score de santé moyen",
    churnRate: "Taux de churn",
    lastSync: "Dernière synchronisation",
    manualRefresh: "Actualisation manuelle",
    syncInProgress: "Synchronisation en cours...",
  },

  // Scores
  scores: {
    healthScore: "Score de santé",
    churnRisk: "Risque de churn",
    expansionScore: "Score d'expansion",
    productUsage: "Score d'usage produit",
    financialHealth: "Santé financière",
    engagementScore: "Score d'engagement",
    contractScore: "Score contrat",
  },

  // Segments (section 4.3)
  segments: {
    title: "Segments clients",
    champions: "Champions",
    expanding: "En expansion",
    stable: "Stables",
    atRiskLight: "À risque léger",
    critical: "En danger critique",
    unpaid: "Impayés",
    churned: "En churn",
    newAccounts: "Nouveaux (< 90j)",
  },

  // Comptes
  accounts: {
    title: "Comptes clients",
    search: "Rechercher un compte...",
    planTier: "Plan",
    billingInterval: "Facturation",
    mrr: "MRR",
    seats: "Sièges",
    healthScore: "Santé",
    churnRisk: "Risque",
    contractEnd: "Fin contrat",
    noAccounts: "Aucun compte trouvé",
    exportCsv: "Exporter CSV",
    monthly: "Mensuel",
    annual: "Annuel",
    starter: "Starter",
    growth: "Growth",
    enterprise: "Enterprise",
  },

  // Détail compte
  accountDetail: {
    overview: "Vue d'ensemble",
    subscriptions: "Abonnements",
    invoices: "Factures",
    usage: "Usage produit",
    scoreHistory: "Historique des scores",
    hubspot: "Données HubSpot",
    noData: "Aucune donnée disponible",
    stripeId: "ID Stripe",
    hubspotId: "ID HubSpot",
    contractPeriod: "Période de contrat",
    seatUsage: "Utilisation des sièges",
  },

  // Abonnements
  subscriptions: {
    active: "Actif",
    pastDue: "Impayé",
    canceled: "Annulé",
    trialing: "En essai",
    paused: "En pause",
    quantity: "Quantité",
    trialEnds: "Fin d'essai",
    cancelsAt: "Annulation prévue",
  },

  // Factures
  invoices: {
    draft: "Brouillon",
    open: "Ouverte",
    paid: "Payée",
    void: "Annulée",
    uncollectible: "Irrécupérable",
    amount: "Montant",
    date: "Date",
    status: "Statut",
    paidAt: "Payée le",
    dueDate: "Échéance",
  },

  // Tableau MRR
  mrr: {
    title: "Tableau MRR / ARR / NRR",
    movements: "Mouvements MRR",
    new: "Nouveau",
    expansion: "Expansion",
    contraction: "Contraction",
    churn: "Churn",
    reactivation: "Réactivation",
    net: "Net",
    trend: "Tendance MRR",
    cohortNrr: "NRR par cohorte",
    period: "Période",
  },

  // Playbooks
  playbooks: {
    title: "Playbooks",
    create: "Créer un playbook",
    active: "Actif",
    inactive: "Inactif",
    executions: "Exécutions",
    successRate: "Taux de réussite",
    lastRun: "Dernière exécution",
    triggerType: "Déclencheur",
  },

  // Actions
  actions: {
    title: "Actions",
    pending: "En attente",
    running: "En cours",
    completed: "Terminée",
    failed: "Échouée",
    total: "Total",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois",
  },

  // Synchronisations
  syncs: {
    title: "Synchronisations",
    syncStripeIncremental: "Sync Stripe incrémental",
    syncStripeFull: "Sync Stripe complet",
    recalculateScores: "Recalculer les scores",
    syncRunning: "Sync en cours...",
    calculating: "Calcul en cours...",
    source: "Source",
    type: "Type",
    status: "Statut",
    startedAt: "Démarré",
    duration: "Durée",
    recordsProcessed: "Traités",
    recordsCreated: "Créés",
    recordsUpdated: "Mis à jour",
    recordsFailed: "Échecs",
    errorMessage: "Erreur",
    noSyncs: "Aucune synchronisation",
    syncTriggered: "Synchronisation déclenchée",
    scoresRecalculated: "Scores recalculés avec succès",
    syncFailed: "Échec de la synchronisation",
    seconds: "s",
  },

  // Paramètres
  settings: {
    title: "Paramètres",
    organization: "Organisation",
    integrations: "Intégrations",
    team: "Équipe",
    orgName: "Nom de l'organisation",
    stripeConnect: "Connexion Stripe",
    stripeConnected: "Stripe connecté",
    stripeNotConnected: "Stripe non connecté",
    connectStripe: "Connecter Stripe",
    hubspotConnect: "Connexion HubSpot",
    hubspotConnected: "HubSpot connecté",
    hubspotNotConnected: "HubSpot non connecté",
    connectHubspot: "Connecter HubSpot",
    inviteUser: "Inviter un utilisateur",
    role: "Rôle",
    owner: "Propriétaire",
    admin: "Administrateur",
    member: "Membre",
  },

  // Onboarding
  onboarding: {
    welcome: "Bienvenue sur Sentio AI",
    setupOrg: "Configuration de votre organisation",
    stripeAccountId: "Identifiant Stripe Connect",
    hubspotApiKey: "Clé API HubSpot (optionnel)",
    orgName: "Nom de votre organisation",
    continue: "Continuer",
    syncingData: "Synchronisation de vos données...",
    syncComplete: "Synchronisation terminée",
    syncStep: {
      stripe: "Synchronisation Stripe",
      hubspot: "Synchronisation HubSpot",
      scoring: "Calcul des scores",
    },
  },

  // Insights IA
  insights: {
    title: "Insights IA",
    churnPrediction: "Prédiction de churn",
    expansionOpportunity: "Opportunité d'expansion",
    renewalAlert: "Alerte renouvellement",
    usageDecline: "Baisse d'usage",
    paymentRisk: "Risque de paiement",
    markAsRead: "Marquer comme lu",
    severity: {
      low: "Faible",
      medium: "Moyen",
      high: "Élevé",
      critical: "Critique",
    },
  },

  // Auth
  auth: {
    login: "Connexion",
    email: "Adresse email",
    password: "Mot de passe",
    signIn: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    invalidCredentials: "Identifiants invalides",
    sessionExpired: "Session expirée, veuillez vous reconnecter",
  },

  // Commun
  common: {
    loading: "Chargement...",
    error: "Une erreur est survenue",
    retry: "Réessayer",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    create: "Créer",
    search: "Rechercher...",
    noResults: "Aucun résultat",
    back: "Retour",
    next: "Suivant",
    previous: "Précédent",
    of: "sur",
    showing: "Affichage de",
    perPage: "par page",
    all: "Tous",
    none: "Aucun",
    yes: "Oui",
    no: "Non",
    confirm: "Confirmer",
    close: "Fermer",
  },

  // Formatage
  format: {
    currency: (cents: number) =>
      (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
    percentage: (value: number) => `${value.toFixed(1)} %`,
    date: (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR'),
    dateTime: (dateStr: string) => new Date(dateStr).toLocaleString('fr-FR'),
  },
};

export type Translations = typeof fr;
export default fr;
