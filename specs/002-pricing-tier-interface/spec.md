# Feature Specification: Interface différenciée selon le palier tarifaire

**Feature Branch**: `002-pricing-tier-interface`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Interface différenciée selon le palier tarifaire : (1) affichage du palier actuel et de la progression vers la limite de comptes actifs suivis ; (2) CTA self-serve par défaut pour Free/Growth, avec proposition d'appel affichée spécifiquement au moment de la connexion de la clé Stripe (pas avant, pas ailleurs) ; (3) CTA 'demander un rendez-vous' obligatoire et sans alternative self-serve pour Scale et Enterprise. Note : ce plan consomme un état de palier renvoyé par l'API, il ne décide pas lui-même du palier ni de la bascule self-serve/RDV — cette logique métier reste côté backend. La bascule self-serve/RDV pour Free/Growth est active par défaut (chantier A confirmé livré)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Voir son palier actuel et sa progression vers la limite de comptes (Priority: P1)

En tant qu'utilisateur d'un organisation cliente, je veux voir mon palier tarifaire
actuel et ma progression vers la limite de comptes actifs suivis, afin de savoir si je
me rapproche d'un plafond et si je dois envisager une évolution de palier.

**Why this priority**: C'est l'information la plus consultée en continu (barre de
progression persistante), et un prérequis d'affichage pour les Stories 2 et 3 qui en
dépendent pour savoir quel CTA proposer.

**Independent Test**: Peut être testé en consultant l'interface avec des organisations
à différents paliers et différents niveaux de progression vers la limite, et en
vérifiant que le palier et la progression affichés correspondent à l'état renvoyé par
l'API.

**Acceptance Scenarios**:

1. **Given** une organisation sur un palier avec une limite de comptes actifs suivis
   définie, **When** l'utilisateur consulte l'interface, **Then** il voit le nom du
   palier actuel et une progression (ex. "42 / 50 comptes suivis") vers la limite.
2. **Given** une organisation sur un palier sans limite (illimité), **When**
   l'utilisateur consulte l'interface, **Then** le palier est affiché sans barre de
   progression trompeuse (ex. "Illimité" plutôt qu'un ratio contre une limite
   inexistante).

---

### User Story 2 - CTA self-serve par défaut (Free/Growth), proposition d'appel uniquement à la connexion Stripe (Priority: P2)

En tant qu'utilisateur sur un palier Free ou Growth, je veux pouvoir gérer mon
abonnement en self-serve par défaut, et ne voir une proposition d'appel commercial
qu'au moment précis où je connecte ma clé API Stripe (jamais avant, jamais à un autre
endroit de l'app), afin de na pas être sollicité de manière intrusive en dehors de ce
contexte précis.

**Why this priority**: Dépend de la Story 1 (connaître le palier) pour savoir quel CTA
afficher, et constitue le cœur de la différenciation self-serve.

**Independent Test**: Peut être testé en visitant l'app en tant qu'organisation
Free/Growth à divers endroits (dashboard, settings, etc.) et en vérifiant qu'aucune
proposition d'appel n'apparaît, puis en arrivant sur l'écran de connexion de la clé
Stripe et en vérifiant qu'elle y apparaît.

**Acceptance Scenarios**:

1. **Given** une organisation Free ou Growth, **When** l'utilisateur navigue dans
   l'application hors de l'écran de connexion Stripe, **Then** seul un CTA self-serve
   (gérer l'abonnement / changer de palier) est visible, sans proposition d'appel.
2. **Given** une organisation Free ou Growth, **When** l'utilisateur arrive sur l'écran
   de connexion de la clé API Stripe, **Then** une proposition d'appel commercial est
   affichée en complément du flux self-serve (sans le bloquer).

---

### User Story 3 - CTA "demander un rendez-vous" exclusif pour Scale et Enterprise (Priority: P3)

En tant qu'utilisateur sur un palier Scale ou Enterprise, je veux voir uniquement un
CTA "demander un rendez-vous" pour toute action liée à mon abonnement, sans alternative
self-serve, afin que la relation commerciale se fasse exclusivement via l'équipe
Sentio pour ces paliers.

**Why this priority**: Dépend elle aussi de la Story 1 pour connaître le palier, et
son impact concerne un sous-ensemble de comptes (Scale/Enterprise) plus restreint que
la Story 2.

**Independent Test**: Peut être testé en visitant l'app en tant qu'organisation
Scale/Enterprise et en vérifiant qu'aucun CTA self-serve n'est jamais présenté, quel
que soit l'écran visité (y compris la connexion Stripe).

**Acceptance Scenarios**:

1. **Given** une organisation sur le palier Scale ou Enterprise, **When** l'utilisateur
   consulte n'importe quel écran lié à son abonnement (y compris la connexion Stripe),
   **Then** seul un CTA "demander un rendez-vous" est visible, sans alternative
   self-serve.
2. **Given** une organisation sur le palier Scale ou Enterprise, **When** l'utilisateur
   clique sur "demander un rendez-vous", **Then** il est dirigé vers le mécanisme de
   prise de rendez-vous désigné par le backend (contrat à confirmer, voir Dependencies).

---

### Edge Cases

- Que se passe-t-il si l'état de palier renvoyé par l'API est temporairement
  indisponible (erreur réseau, timeout) ? L'interface doit éviter d'afficher par
  défaut un CTA self-serve à une organisation Scale/Enterprise (ou l'inverse) en cas
  d'échec de chargement — état de chargement/erreur explicite requis plutôt qu'un
  palier supposé.
- Que se passe-t-il si une organisation change de palier pendant une session active
  (ex. upgrade en cours) ? L'interface doit refléter le nouveau palier sans nécessiter
  un rechargement complet de la page.
- Que se passe-t-il si le palier renvoyé par l'API ne correspond à aucune des valeurs
  connues du frontend (nouveau palier ajouté côté backend sans mise à jour du
  frontend) ? Comportement de repli à définir plutôt que de planter ou d'assumer un
  comportement self-serve par défaut.
- Que se passe-t-il si une organisation Free/Growth n'a pas encore connecté de clé
  Stripe (nouvel onboarding) ? La proposition d'appel ne doit apparaître qu'à l'étape
  de connexion elle-même, pas avant dans le flux d'onboarding.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher le palier tarifaire actuel de l'organisation
  dans l'interface.
- **FR-002**: Le système DOIT afficher la progression de l'organisation vers sa limite
  de comptes actifs suivis, lorsque cette limite existe, sous une forme claire
  (ex. ratio "N / limite").
- **FR-003**: Le système DOIT afficher "Illimité" (ou équivalent) plutôt qu'une barre
  de progression lorsque le palier n'a pas de limite de comptes actifs suivis.
- **FR-004**: Pour les paliers Free et Growth, le système DOIT afficher un CTA
  self-serve (gérer l'abonnement / changer de palier) par défaut, sur l'ensemble de
  l'application.
- **FR-005**: Pour les paliers Free et Growth, le système DOIT afficher une
  proposition d'appel commercial uniquement au moment de la connexion de la clé API
  Stripe, et nulle part ailleurs.
- **FR-006**: Pour les paliers Scale et Enterprise, le système DOIT afficher
  uniquement un CTA "demander un rendez-vous", sans aucune alternative self-serve, sur
  l'ensemble de l'application (y compris l'écran de connexion Stripe).
- **FR-007**: Le système NE DOIT PAS décider lui-même du palier ni de la logique
  self-serve/RDV — ces informations sont consommées depuis un état de palier renvoyé
  par l'API, jamais recalculées ou devinées côté frontend.
- **FR-008**: Le système DOIT gérer explicitement un état de chargement et un état
  d'erreur pour la récupération du palier, sans afficher par défaut un CTA incorrect
  pendant ce temps (voir Edge Cases).

### Key Entities *(include if feature involves data)*

- **État de palier** : représente le palier tarifaire actuel de l'organisation, sa
  limite de comptes actifs suivis (le cas échéant), le nombre de comptes actuellement
  suivis, et l'indicateur self-serve/RDV applicable — entièrement fourni par l'API.
- **CTA d'abonnement** : action proposée à l'utilisateur (self-serve ou demande de
  rendez-vous), dont la forme dépend du palier et, pour Free/Growth, du contexte
  (connexion Stripe ou non).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur peut identifier son palier actuel et sa progression vers
  la limite de comptes en moins de 5 secondes après arrivée sur l'écran concerné.
- **SC-002**: 100% des organisations Scale/Enterprise ne voient jamais de CTA
  self-serve, sur l'ensemble des écrans testés.
- **SC-003**: 100% des organisations Free/Growth ne voient la proposition d'appel
  commercial qu'au moment de la connexion de la clé Stripe, jamais ailleurs dans
  l'application.
- **SC-004**: Aucune régression visuelle constatée sur les écrans existants
  impactés (dashboard, settings, onboarding Stripe) lors de l'intégration de ces
  éléments.

## Assumptions

- L'état de palier (nom du palier, limite de comptes, nombre de comptes suivis,
  indicateur self-serve/RDV) est entièrement calculé et renvoyé par le backend ; le
  frontend ne fait qu'afficher cet état, conformément à la note du chantier D.
- Le chantier A (bascule self-serve/RDV) étant confirmé livré, l'indicateur
  self-serve/RDV pour Free/Growth est actif par défaut côté backend — ce plan ne
  prévoit donc pas de logique conditionnelle supplémentaire pour ce point précis,
  uniquement sa consommation et son affichage.
- Le mécanisme concret de "demander un rendez-vous" (lien externe, formulaire,
  Calendly ou équivalent) est fourni/désigné par le backend ou une configuration
  existante — non inventé ici (voir Dependencies).
- Le palier "Scale" constitue une valeur de palier distincte de "Enterprise" dans le
  contrat API à venir ; le type frontend existant (`PlanType` dans
  `src/lib/types/trial.ts` : `'free' | 'starter' | 'growth' | 'enterprise'`) ne
  contient aujourd'hui ni "scale" ni une correspondance univoque avec "growth" au sens
  de ce chantier — à clarifier avec le backend plutôt qu'assumé (voir Dependencies).

## Dependencies (backend — à demander, non inventées ici)

- **Aucun contrat n'existe aujourd'hui** dans `docs/API_CONTRACTS.md` pour : le
  palier tarifaire de l'organisation avec sa limite de comptes actifs suivis et le
  nombre de comptes actuellement suivis, ni pour un indicateur explicite
  self-serve/RDV par palier.
- Un contrat partiel existe déjà côté frontend pour un état de palier lié à l'essai
  (`GET /trial-status` → `TrialStatus` dans `src/lib/types/trial.ts`, avec
  `plan_type: 'free' | 'starter' | 'growth' | 'enterprise'`), mais il ne couvre ni la
  limite/progression de comptes actifs suivis, ni un palier "Scale" distinct, ni
  l'indicateur self-serve/RDV — à confirmer avec le backend s'il doit être étendu ou
  remplacé par un nouveau contrat dédié à ce chantier.
- Le mécanisme de "demander un rendez-vous" (lien externe fixe, endpoint de
  génération de lien personnalisé, etc.) doit être précisé par le backend — non
  inventé ici.
- Ces éléments doivent faire l'objet d'une demande de contrat backend explicite avant
  l'implémentation — le plan associé à cette spec les traite comme dépendances non
  résolues plutôt que de supposer une forme de données.
