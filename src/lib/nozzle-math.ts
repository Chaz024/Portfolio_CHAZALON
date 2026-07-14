// Relation aire–Mach isentropique + colormap plasma (échantillonnée de matplotlib).
export function areaRatio(M: number, g = 1.4): number {
  const e = (g + 1) / (2 * (g - 1));
  return (1 / M) * Math.pow(((2 / (g + 1)) * (1 + ((g - 1) / 2) * M * M)), e);
}
export function machFromAreaRatio(ratio: number, branch: 'sub' | 'sup', g = 1.4): number {
  if (ratio <= 1) return 1;
  let M = branch === 'sup' ? 2 : 0.3;
  for (let i = 0; i < 60; i++) {
    const f = areaRatio(M, g) - ratio;
    const h = 1e-6;
    const df = (areaRatio(M + h, g) - areaRatio(M - h, g)) / (2 * h);
    const next = M - f / df;
    M = branch === 'sup' ? Math.max(1.000001, next) : Math.min(0.999999, Math.max(1e-4, next));
    if (Math.abs(f) < 1e-10) break;
  }
  return M;
}
const STOPS: [number, number, number][] = [
  [13, 8, 135], [84, 2, 163], [139, 10, 165], [185, 50, 137],
  [219, 92, 104], [244, 136, 73], [254, 188, 43], [240, 249, 33],
];
export function plasma(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  return [0, 1, 2].map((k) => Math.round(STOPS[i][k] + f * (STOPS[i + 1][k] - STOPS[i][k]))) as [number, number, number];
}
