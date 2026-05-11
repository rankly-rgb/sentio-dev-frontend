export type Language = 'fr' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.today': "Aujourd'hui",
    'nav.dashboard': "Vue d'ensemble",
    'nav.accounts': 'Comptes clients',
    'nav.segments': 'Segments',
    'nav.insights': 'Insights IA',
    'nav.playbooks': 'Playbooks',
    'nav.syncs': 'Synchronisations',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Se déconnecter',
    'nav.destinations': 'Destinations webhook',
    'nav.playbookDestinations': 'Destinations',
    'nav.playbookApprovals': 'Approbations',
    'nav.ops': 'Ops Admin',

    // Dashboard
    'dashboard.title': "Vue d'ensemble rétention",
    'dashboard.subtitle': 'Tableau de bord de votre base client',
    'dashboard.mrr': 'MRR',
    'dashboard.arr': 'ARR',
    'dashboard.nrr': 'NRR',
    'dashboard.activeAccounts': 'Comptes actifs',
    'dashboard.accountsAtRisk': 'Comptes à risque',
    'dashboard.mrrAtRisk': 'MRR à risque',
    'dashboard.viewAll': 'Voir tout',
    'dashboard.lastSync': 'Dernière synchronisation',
    'dashboard.manualRefresh': 'Actualisation manuelle',
    'dashboard.topAtRisk': 'Comptes à risque',
    'dashboard.topExpansion': "Opportunités d'expansion",

    // Accounts
    'accounts.title': 'Comptes clients',
    'accounts.search': 'Rechercher un compte...',
    'accounts.exportCsv': 'Exporter CSV',
    'accounts.noAccounts': 'Aucun compte trouvé',

    // Settings
    'settings.language': 'Langue de l\'interface',
    'settings.languageDesc': 'Choisissez la langue affichée dans l\'application. Ce paramètre s\'applique à toute l\'organisation.',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
  },

  en: {
    // Navigation
    'nav.today': 'Today',
    'nav.dashboard': 'Overview',
    'nav.accounts': 'Accounts',
    'nav.segments': 'Segments',
    'nav.insights': 'AI Insights',
    'nav.playbooks': 'Playbooks',
    'nav.syncs': 'Syncs',
    'nav.settings': 'Settings',
    'nav.logout': 'Log out',
    'nav.destinations': 'Webhook destinations',
    'nav.playbookDestinations': 'Destinations',
    'nav.playbookApprovals': 'Approvals',
    'nav.ops': 'Ops Admin',

    // Dashboard
    'dashboard.title': 'Retention overview',
    'dashboard.subtitle': 'Customer base dashboard',
    'dashboard.mrr': 'MRR',
    'dashboard.arr': 'ARR',
    'dashboard.nrr': 'NRR',
    'dashboard.activeAccounts': 'Active accounts',
    'dashboard.accountsAtRisk': 'Accounts at risk',
    'dashboard.mrrAtRisk': 'MRR at risk',
    'dashboard.viewAll': 'View all',
    'dashboard.lastSync': 'Last sync',
    'dashboard.manualRefresh': 'Manual refresh',
    'dashboard.topAtRisk': 'Accounts at risk',
    'dashboard.topExpansion': 'Expansion opportunities',

    // Accounts
    'accounts.title': 'Accounts',
    'accounts.search': 'Search an account...',
    'accounts.exportCsv': 'Export CSV',
    'accounts.noAccounts': 'No accounts found',

    // Settings
    'settings.language': 'Interface language',
    'settings.languageDesc': 'Choose the language displayed across the application. This setting applies to the entire organisation.',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
  },
};
