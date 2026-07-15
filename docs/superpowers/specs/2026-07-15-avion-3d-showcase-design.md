# Spec — Section « Avion 3D » (projets sélectionnés)

Date : 2026-07-15
Statut : validé en brainstorming (Hugo)

## Objectif

Ajouter sur la page d'accueil, entre le hero et l'index des études, une section
signature `PlaneShowcase` : un avion de ligne 3D interactif servant de sommaire
visuel pour une sélection d'études. Chaque étude sélectionnée est ancrée à la
partie de l'avion qu'elle concerne (clim → pack ECS, NACA → aile, etc.).
**Design et interaction uniquement** : le contenu des fiches est branché sur la
collection `etudes` existante (titres/tags réels), aucune prose nouvelle.

## Décisions actées

| Sujet | Décision |
|---|---|
| Rendu | Vrai 3D (three.js), stylisé « maquette de bureau d'études » pour rester dans l'identité print |
| Emplacement | Section de l'accueil, entre hero et index ; l'index complet reste la nav exhaustive |
| Interaction | Orbite libre + clic hotspot → travelling caméra + fiche latérale en ink reveal |
| Hotspots | 5–6 pièces clés + badge « avion entier » dans le cartouche |
| Stack | React autorisé : `@astrojs/react` + React Three Fiber + drei, ink reveal 21st.dev réutilisable tel quel |

## Architecture

- **Intégration** : `@astrojs/react` ajouté au projet. Un seul îlot React,
  monté `client:visible` — le reste du site reste 100 % Astro statique.
- **Composants** (`src/components/plane/`) :
  - `PlaneShowcase.astro` — section, titre système existant (mono-label
    « Planche 00 — Vue d'ensemble » + titre display), grille 12 col : canvas
    ~8/12, fiche ~4/12. Monte l'îlot React et porte le fallback no-JS.
  - `PlaneScene.tsx` (îlot) — Canvas R3F : modèle, contrôles, hotspots, état
    « pièce active », communique la sélection à la fiche.
  - `Hotspot.tsx` — repère nomenclature mono `[05]` + leader line, via drei
    `Html` (vrai DOM, stylé avec le CSS existant), face caméra, atténué
    (occlude) derrière le fuselage.
  - `StudyCard.tsx` — fiche latérale cartouche : repère, titre, 2–3 tags mono,
    lien « Voir l'étude → ». Apparition par ink reveal.
  - `InkReveal.tsx` — composant 21st.dev (masque encre organique,
    `feTurbulence`/canvas), encre orange accent.
- **Données** : `src/data/planeHotspots.ts` — mapping statique
  `{ slug étude → nom de pièce, position 3D, libellé }`. Les titres/tags sont
  résolus depuis la collection `etudes` côté Astro et passés en props à l'îlot.

## Mapping hotspots (initial)

| Pièce | Étude(s) |
|---|---|
| Nacelle | Aéroacoustique LBM (01) |
| Aile | NACA 4412 Fluent · Aile en effet de sol |
| Empennage / tandem | Ailes en tandem |
| Pack ECS (ventre) | Climatisation avion au sol |
| Moteur / tuyère | Écoulements compressibles · Combustion |
| Avion entier (badge cartouche) | BEI avion écopant |

Quand une pièce porte deux études, la fiche liste les deux entrées.

## Direction artistique du 3D

- Modèle glTF libre de droits, avion de ligne low-poly type A320, compressé
  Draco, budget < 500 ko.
- Rematérialisé : matériau uni blanc cassé papier (pas de textures photo),
  arêtes soulignées en traits d'encre fins (drei `Edges` ou outline), ombre de
  contact douce au sol (`ContactShadows`) comme une ombre de planche.
- Fond transparent : le papier du site est le fond de scène.
- Orange accent réservé aux hotspots et à la pièce survolée/active (la pièce
  « s'encre » en orange).

## Interaction

- Orbite libre (rotation + zoom léger, pas de pan), inertie, lente rotation
  auto au repos. drei `CameraControls`.
- Clic hotspot : travelling caméra ~800 ms vers la pièce, pièce encrée orange,
  fiche latérale révélée en ink reveal. Re-clic ou clic ailleurs → retour vue
  d'ensemble, fiche remplacée par l'état par défaut (invite « Cliquer un
  repère »).

## Robustesse

- **Mobile** : orbite tactile un doigt ; la fiche passe sous le canvas
  (empilement) au lieu d'à côté.
- **`prefers-reduced-motion`** : pas de rotation auto ni de travelling animé
  (saut direct), ink reveal remplacé par un fondu.
- **Fallback no-JS / no-WebGL** : image statique de l'avion (render
  pré-généré) + liste de liens vers les études mappées. SEO intact (les liens
  existent dans le HTML du fallback).
- **Perf** : three/R3F et le glTF chargés uniquement via `client:visible` ;
  aucun impact sur le chargement initial ni sur les autres pages.

## Tests

- Unitaires (vitest) : mapping `planeHotspots` → chaque slug existe dans la
  collection `etudes` ; résolution titre/tags.
- Vérification manuelle (skill verify) : orbite, clic hotspot → caméra +
  fiche, ink reveal, mobile, reduced-motion, fallback JS désactivé.

## Hors périmètre

- Rédaction de contenu projet (prose des fiches au-delà des titres/tags
  existants).
- Mapping des études non aéronautiques (HPC, peloton, sismique…) — elles
  restent servies par l'index.
