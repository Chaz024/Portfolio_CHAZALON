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
    anchor: [1.35, -0.32, 1.15],
    camera: [3.9, 0.5, 3.6],
  },
  {
    id: 'aile',
    label: 'Voilure',
    slugs: ['profil-naca-fluent', 'aerodynamique-effet-sol'],
    anchor: [2.6, 0.12, -0.55],
    camera: [5.0, 1.8, 1.6],
  },
  {
    id: 'empennage',
    label: 'Empennage',
    slugs: ['aile-tandem'],
    anchor: [1.15, 0.3, -3.15],
    camera: [3.4, 1.7, -5.9],
  },
  {
    id: 'ecs',
    label: 'Pack ECS',
    slugs: ['clim-avion'],
    anchor: [0, -0.68, 0.1],
    camera: [3.4, -0.35, 3.8],
  },
  {
    id: 'moteur',
    label: 'Moteur — tuyère',
    slugs: ['ecoulements-compressibles', 'combustion'],
    anchor: [-1.35, -0.32, -0.2],
    camera: [-3.9, 0.3, 3.1],
  },
];

/** Étude « avion entier », affichée dans le cartouche plutôt que sur une pièce */
export const wholeAircraft = {
  id: 'avion',
  label: 'Avion entier',
  slugs: ['bei-imperial-scooper'],
};
