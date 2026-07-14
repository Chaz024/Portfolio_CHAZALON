// src/lib/nozzle-math.test.ts
import { describe, expect, it } from 'vitest';
import { areaRatio, machFromAreaRatio, plasma } from './nozzle-math';

describe('areaRatio', () => {
  it('vaut 1 au col (M=1)', () => expect(areaRatio(1)).toBeCloseTo(1, 6));
  it('vaut 1.6875 à M=2 (γ=1.4)', () => expect(areaRatio(2)).toBeCloseTo(1.6875, 4));
  it('croît en subsonique décroissant et supersonique croissant', () => {
    expect(areaRatio(0.3)).toBeGreaterThan(areaRatio(0.6));
    expect(areaRatio(3)).toBeGreaterThan(areaRatio(2));
  });
});
describe('machFromAreaRatio', () => {
  it('inverse areaRatio sur la branche supersonique', () =>
    expect(machFromAreaRatio(1.6875, 'sup')).toBeCloseTo(2, 3));
  it('inverse areaRatio sur la branche subsonique', () =>
    expect(machFromAreaRatio(areaRatio(0.4), 'sub')).toBeCloseTo(0.4, 3));
  it('rend 1 pour ratio=1', () => expect(machFromAreaRatio(1, 'sup')).toBeCloseTo(1, 3));
});
describe('plasma', () => {
  it('borne les entrées', () => {
    expect(plasma(-1)).toEqual(plasma(0));
    expect(plasma(2)).toEqual(plasma(1));
  });
  it('rend des canaux 0-255', () =>
    plasma(0.5).forEach((c) => { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(255); }));
});
