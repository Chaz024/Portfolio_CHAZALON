// src/lib/url.ts — préfixe BASE_URL pour GitHub Pages
export const withBase = (path: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
