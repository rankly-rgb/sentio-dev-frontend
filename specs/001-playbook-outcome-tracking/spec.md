# Feature Specification: Boucle de preuve de résultat des playbooks

**Feature Branch**: `001-playbook-outcome-tracking`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Interface de suivi d'exécution des playbooks : (1) bouton 'marquer comme exécuté' visible sur chaque playbook actif, affichant la fenêtre d'attribution en cours ; (2) vue dédiée affichant le taux de résolution playbooks exécutés vs non exécutés (pensée comme générateur de preuve pour futurs case studies) ; (3) nudge de confirmation manuelle ('Ce playbook a-t-il aidé ?') affiché après la fenêtre d'attribution."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marquer un playbook comme exécuté (Priority: P1)

En tant qu'utilisateur gérant un compte à risque, je veux pouvoir marquer manuellement
un playbook actif comme "exécuté" (par exemple après une action manuelle hors-outil,
comme un appel client) afin que Sentio commence à suivre si cette action a résolu le
problème.

**Why this priority**: Sans ce marquage, aucune donnée d'attribution ne peut être
collectée — c'est le point d'entrée de toute la boucle de preuve.

**Independent Test**: Peut être testé en marquant un playbook actif comme exécuté et en
vérifiant qu'une fenêtre d'attribution démarre et s'affiche.

**Acceptance Scenarios**:

1. **Given** un playbook actif sur un compte, **When** l'utilisateur clique sur "marquer
   comme exécuté", **Then** le playbook affiche son statut "exécuté" et la fenêtre
   d'attribution en cours (ex. "12 jours restants avant évaluation").
2. **Given** un playbook déjà marqué comme exécuté, **When** l'utilisateur consulte à
   nouveau la carte du playbook, **Then** le bouton "marquer comme exécuté" est remplacé
   par l'indicateur de fenêtre d'attribution en cours (pas de double marquage possible).

---

### User Story 2 - Vue du taux de résolution exécuté vs non-exécuté (Priority: P2)

En tant que responsable produit ou growth, je veux consulter une vue dédiée comparant
le taux de résolution des comptes à risque ayant eu un playbook exécuté vs ceux n'en
ayant pas eu, afin de disposer d'une preuve chiffrée de la valeur des playbooks pour
de futurs case studies clients.

**Why this priority**: C'est la finalité "preuve" de la fonctionnalité, mais elle dépend
des données produites par la Story 1 (marquage) pour avoir du sens.

**Independent Test**: Peut être testé en consultant la vue avec un jeu de comptes ayant
des playbooks exécutés et non-exécutés, et en vérifiant que les deux taux de résolution
s'affichent avec un nombre d'échantillons suffisant visible.

**Acceptance Scenarios**:

1. **Given** un ensemble de comptes avec playbooks exécutés et non-exécutés,
   **When** l'utilisateur ouvre la vue dédiée, **Then** il voit le taux de résolution
   de chaque groupe (exécuté / non-exécuté) avec la taille d'échantillon associée.
2. **Given** un échantillon trop faible pour être significatif, **When** l'utilisateur
   consulte la vue, **Then** un message explicite indique que les données sont
   insuffisantes plutôt que d'afficher un taux trompeur.

---

### User Story 3 - Nudge de confirmation manuelle post-attribution (Priority: P3)

En tant qu'utilisateur ayant marqué un playbook comme exécuté, je veux recevoir une
sollicitation ("Ce playbook a-t-il aidé ?") une fois la fenêtre d'attribution terminée,
afin de compléter la donnée automatique par un retour qualitatif humain.

**Why this priority**: Vient enrichir la preuve produite par les Stories 1 et 2, mais
n'est pas bloquant pour leur fonctionnement de base.

**Independent Test**: Peut être testé en simulant l'expiration d'une fenêtre
d'attribution et en vérifiant que le nudge apparaît, puis que la réponse est bien
enregistrée et n'est plus proposée après réponse.

**Acceptance Scenarios**:

1. **Given** un playbook marqué exécuté dont la fenêtre d'attribution vient d'expirer,
   **When** l'utilisateur visite l'application, **Then** un nudge "Ce playbook a-t-il
   aidé ?" (Oui/Non ou équivalent) lui est présenté.
2. **Given** un nudge déjà répondu, **When** l'utilisateur revisite l'écran, **Then**
   le nudge ne réapparaît plus pour ce playbook exécuté.

---

### Edge Cases

- Que se passe-t-il si un compte churn ou est résolu pendant la fenêtre d'attribution
  elle-même (avant son expiration) ? Le taux de résolution (Story 2) doit pouvoir
  refléter une résolution survenue *pendant* la fenêtre, pas seulement après.
- Que se passe-t-il si un playbook est réactivé/ré-exécuté sur le même compte après une
  première fenêtre d'attribution déjà écoulée ? Une nouvelle fenêtre doit démarrer sans
  écraser la donnée de la précédente.
- Comment la vue de résolution (Story 2) se comporte-t-elle si le nombre de comptes
  disponibles est trop faible pour être statistiquement significatif ? (voir Acceptance
  Scenario 2 de la Story 2)
- Que se passe-t-il si l'utilisateur marque un playbook comme exécuté par erreur ? Un
  moyen d'annuler ce marquage tant que la fenêtre d'attribution n'a pas expiré doit
  exister.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher un bouton "marquer comme exécuté" sur chaque
  carte de playbook actif qui n'a pas encore été marqué exécuté.
- **FR-002**: Le système DOIT, après marquage, afficher la fenêtre d'attribution en
  cours (durée restante) sur la carte du playbook concerné.
- **FR-003**: Utilisateurs DOIVENT pouvoir annuler un marquage "exécuté" tant que la
  fenêtre d'attribution n'a pas expiré (voir Edge Cases).
- **FR-004**: Le système DOIT fournir une vue dédiée affichant le taux de résolution
  des comptes ayant eu un playbook exécuté vs ceux n'en ayant pas eu.
- **FR-005**: La vue de résolution DOIT indiquer la taille d'échantillon de chaque
  groupe et signaler explicitement une donnée insuffisante plutôt que de calculer un
  taux non fiable.
- **FR-006**: Le système DOIT présenter, une fois la fenêtre d'attribution expirée, un
  nudge de confirmation manuelle ("Ce playbook a-t-il aidé ?") à l'utilisateur.
- **FR-007**: Une fois répondu, le nudge ne DOIT plus être présenté pour ce playbook
  exécuté.
- **FR-008**: Le système DOIT s'appuyer sur des contrats API backend explicites pour le
  marquage exécuté, la fenêtre d'attribution, le taux de résolution et la réponse au
  nudge — aucun contrat de ce type n'existe aujourd'hui dans `docs/API_CONTRACTS.md`
  (voir section Dependencies) ; ils doivent être demandés au backend, pas inventés.

### Key Entities *(include if feature involves data)*

- **Marquage d'exécution de playbook** : associe un playbook actif d'un compte à un
  instant de marquage manuel ; point de départ de la fenêtre d'attribution.
- **Fenêtre d'attribution** : période (durée à définir côté backend) pendant laquelle
  le système observe si le compte se résout après exécution du playbook.
- **Résultat de résolution** : état (résolu / non résolu / en cours) d'un compte
  relativement à une fenêtre d'attribution donnée, utilisé pour agréger le taux de
  résolution exécuté vs non-exécuté.
- **Réponse au nudge de confirmation** : réponse qualitative de l'utilisateur
  ("a aidé" / "n'a pas aidé") associée à un marquage d'exécution donné.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur peut marquer un playbook comme exécuté en moins de 2
  clics depuis la vue playbooks.
- **SC-002**: La vue de taux de résolution affiche un résultat exploitable (ou un
  message d'insuffisance de données explicite) en moins de 3 secondes de chargement.
- **SC-003**: Au moins 90% des nudges de confirmation post-fenêtre reçoivent une
  réponse (Oui/Non) dans les 30 jours suivant leur apparition, une fois la
  fonctionnalité adoptée.
- **SC-004**: La donnée produite par la vue de résolution est utilisable telle quelle
  dans un case study client, sans retraitement manuel supplémentaire.

## Assumptions

- La durée de la fenêtre d'attribution est une donnée métier définie et renvoyée par
  le backend (pas une valeur codée en dur côté frontend) — voir Dependencies.
- Le calcul du taux de résolution (comptes résolus vs non résolus après exécution) est
  effectué côté backend ; le frontend consomme un résultat déjà agrégé, il ne recalcule
  pas l'attribution lui-même.
- "Résolution" d'un compte, dans ce contexte, s'appuie sur une définition déjà connue
  du système existant (ex. sortie de segment à risque / passage en `stable`), à
  confirmer avec le backend plutôt qu'assumée ici.
- Le marquage manuel "exécuté" est distinct du statut d'exécution automatique déjà
  existant (`completed`/`failed`/`skipped`/`partially_completed` dans
  `ExecutionTimeline`) — il s'agit d'une couche de confirmation humaine supplémentaire,
  pas un remplacement.

## Dependencies (backend — à demander, non inventées ici)

- **Aucun contrat API n'existe aujourd'hui** dans `docs/API_CONTRACTS.md` pour :
  le marquage manuel "exécuté" d'un playbook, la durée/état de la fenêtre
  d'attribution, le calcul du taux de résolution exécuté vs non-exécuté (avec taille
  d'échantillon), et le stockage de la réponse au nudge "a aidé ?".
- Ces éléments doivent faire l'objet d'une demande de contrat backend explicite avant
  l'implémentation — le plan associé à cette spec les traite comme dépendances non
  résolues plutôt que de supposer une forme de données.
