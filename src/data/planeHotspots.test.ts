import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { planeParts, wholeAircraft } from './planeHotspots';

const contentDir = join(__dirname, '..', 'content', 'etudes');
const existingSlugs = new Set(
  readdirSync(contentDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, '')),
);

describe('planeHotspots', () => {
  const allSlugs = [...planeParts.flatMap((p) => p.slugs), ...wholeAircraft.slugs];

  it('chaque slug mappé correspond à une étude existante', () => {
    for (const slug of allSlugs) {
      expect(existingSlugs, `slug inconnu : ${slug}`).toContain(slug);
    }
  });

  it('aucun slug mappé deux fois', () => {
    expect(new Set(allSlugs).size).toBe(allSlugs.length);
  });

  it('chaque pièce a un ancrage et une caméra 3D valides', () => {
    for (const p of planeParts) {
      expect(p.anchor).toHaveLength(3);
      expect(p.camera).toHaveLength(3);
      expect(p.slugs.length).toBeGreaterThan(0);
    }
  });
});
