// Mapping pièces de l'avion → études de la collection `etudes`.
// Les positions sont exprimées dans le repère du modèle procédural
// (x = envergure, y = vertical, z = axe fuselage, nez vers +z).

export interface PlanePart {
  id: string;
  /** Libellé de la pièce, façon nomenclature de planche */
  label: string;
  /** Slugs des études ancrées à cette pièce (fichiers de src/content/etudes) */
  slugs: string[];
  /** Point d'ancrage 3D du repère */
  anchor: [number, number, number];
  /** Position caméra du travelling quand la pièce est inspectée */
  camera: [number, number, number];
}

export const planeParts: PlanePart[] = [
  {
    id: 'nacelle',
    label: 'Nacelle',
    slugs: ['aeroacoustique-lbm'],
    anchor: [1.25, -0.25, 1.35],
    camera: [4.2, 0.4, 4.2],
  },
  {
    id: 'aile',
    label: 'Voilure',
    slugs: ['profil-naca-fluent', 'aerodynamique-effet-sol'],
    anchor: [2.7, 0.35, -1.0],
    camera: [5.2, 1.9, 1.2],
  },
  {
    id: 'empennage',
    label: 'Empennage',
    slugs: ['aile-tandem'],
    anchor: [1.35, 0.45, -2.85],
    camera: [3.6, 1.8, -6.2],
  },
  {
    id: 'ecs',
    label: 'Pack ECS',
    slugs: ['clim-avion'],
    anchor: [0, -0.5, -0.9],
    camera: [3.4, -0.5, 3.8],
  },
  {
    id: 'moteur',
    label: 'Moteur — tuyère',
    slugs: ['ecoulements-compressibles'],
    anchor: [-1.25, -0.25, -0.15],
    camera: [-4.2, 0.3, 3.6],
  },
];

/** Étude « avion entier », affichée dans le cartouche plutôt que sur une pièce */
export const wholeAircraft = {
  id: 'avion',
  label: 'Avion entier',
  slugs: ['bei-imperial-scooper'],
};
