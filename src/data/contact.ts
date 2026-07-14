// src/data/contact.ts — SEUL endroit où vivent les coordonnées.
// linkedin/cvPath restent null tant que Hugo ne les a pas fournis → l'UI les masque.
export const contact = {
  email: 'hugochazalon2424@gmail.com',
  linkedin: null as string | null,   // ex. 'https://www.linkedin.com/in/hugo-chazalon'
  cvPath: null as string | null,     // ex. '/cv-hugo-chazalon.pdf' (fichier dans public/)
  ville: 'Toulouse',
};
