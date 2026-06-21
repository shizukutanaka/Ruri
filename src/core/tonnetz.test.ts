import { describe, it, expect } from 'vitest';
import { tonnetzCoords, neoRiemannianP, neoRiemannianL, neoRiemannianR } from './tonnetz.js';

// ---------------------------------------------------------------------------
// L3 — Tonnetz coordinates and neo-Riemannian transformations
// ---------------------------------------------------------------------------

describe('tonnetzCoords (L3)', () => {
  it('test_C_is_origin', () => {
    expect(tonnetzCoords(0)).toEqual({ x: 0, y: 0 });
  });

  it('test_G_coords', () => {
    // G = pc 7; x = (7*7)%12 = 49%12 = 1; y = (7*3)%12 = 21%12 = 9
    expect(tonnetzCoords(7)).toEqual({ x: 1, y: 9 });
  });

  it('test_E_coords', () => {
    // E = pc 4; x = (4*7)%12 = 28%12 = 4; y = (4*3)%12 = 12%12 = 0
    expect(tonnetzCoords(4)).toEqual({ x: 4, y: 0 });
  });

  it('test_all_12_pcs_produce_valid_coords', () => {
    for (let pc = 0; pc < 12; pc++) {
      const { x, y } = tonnetzCoords(pc);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(12);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(12);
    }
  });

  it('test_mod_12_equivalence', () => {
    expect(tonnetzCoords(0)).toEqual(tonnetzCoords(12));
    expect(tonnetzCoords(7)).toEqual(tonnetzCoords(19));
  });
});

describe('neoRiemannianP (L3)', () => {
  it('test_C_major_to_C_minor', () => {
    // C major {0,4,7} → C minor {0,3,7}
    expect(neoRiemannianP([0, 4, 7])).toEqual([0, 3, 7]);
  });

  it('test_C_minor_to_C_major', () => {
    // C minor {0,3,7} → C major {0,4,7}
    expect(neoRiemannianP([0, 3, 7])).toEqual([0, 4, 7]);
  });

  it('test_P_is_involution', () => {
    const orig: [number, number, number] = [0, 4, 7];
    expect(neoRiemannianP(neoRiemannianP(orig))).toEqual([0, 4, 7]);
  });

  it('test_G_major_to_G_minor', () => {
    // G major {7,11,2} sorted = [2,7,11] — detect root: 7 gives intervals 4,7 → major root=7
    // G minor = {7, 10, 2} sorted = [2,7,10]
    expect(neoRiemannianP([7, 11, 2])).toEqual([2, 7, 10]);
  });

  it('test_F_major_to_F_minor', () => {
    // F major = {5,9,0} sorted=[0,5,9]; root=5: 9-5=4, 0+12-5=7 → major
    // F minor = {5,8,0} sorted=[0,5,8]
    expect(neoRiemannianP([5, 9, 0])).toEqual([0, 5, 8]);
  });
});

describe('neoRiemannianL (L3)', () => {
  it('test_C_major_L', () => {
    // C major {0,4,7}: L moves root down by 1 → {11,4,7} sorted=[4,7,11]
    expect(neoRiemannianL([0, 4, 7])).toEqual([4, 7, 11]);
  });

  it('test_L_on_minor_moves_fifth_up', () => {
    // E minor {4,7,11}: detect root with interval (3,7):
    // root=4: 7-4=3✓, 11-4=7✓ → minor, fifth = 11
    // L: fifth 11 → 0, so {4,7,0} sorted=[0,4,7]
    expect(neoRiemannianL([4, 7, 11])).toEqual([0, 4, 7]);
  });

  it('test_L_is_involution', () => {
    const orig: [number, number, number] = [0, 4, 7];
    expect(neoRiemannianL(neoRiemannianL(orig))).toEqual([0, 4, 7]);
  });
});

describe('neoRiemannianR (L3)', () => {
  it('test_C_major_to_A_minor', () => {
    // C major {0,4,7}: R keeps root(C=0) and third(E=4), replaces fifth G→A(9)
    // Result: A minor {0,4,9}
    expect(neoRiemannianR([0, 4, 7])).toEqual([0, 4, 9]);
  });

  it('test_A_minor_to_C_major', () => {
    // A minor {0,4,9}: root=9, third=0, fifth=4
    // R keeps third(C=0) and fifth(E=4), replaces root A→G(7)
    // Result: C major {0,4,7}
    expect(neoRiemannianR([0, 4, 9])).toEqual([0, 4, 7]);
  });

  it('test_R_is_involution', () => {
    const orig: [number, number, number] = [0, 4, 7];
    expect(neoRiemannianR(neoRiemannianR(orig))).toEqual([0, 4, 7]);
  });

  it('test_R_G_major', () => {
    // G major {7,11,2}: root=7, third=11(B), fifth=2(D)
    // R: keep root(G=7) and third(B=11), replace fifth D→E(4)
    // Result: E minor {4,7,11}
    expect(neoRiemannianR([7, 11, 2])).toEqual([4, 7, 11]);
  });

  it('test_R_produces_valid_minor_from_major', () => {
    // R on C major → A minor, which is a valid minor triad
    const result = neoRiemannianR([0, 4, 7]);
    // A minor [0,4,9]: root=9 → mod12(0-9)=3, mod12(4-9)=7 confirms minor
    expect(result).toEqual([0, 4, 9]);
    const back = neoRiemannianR(result);
    expect(back).toEqual([0, 4, 7]);
  });
});
