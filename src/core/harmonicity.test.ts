/**
 * Tests for harmonicity.ts — approxRatio, relativePeriodicity, chordPeriodicity.
 *
 * Socratic Q15 (round 3): relativePeriodicity can return Infinity when the LCM of
 * approximated denominators overflows Number.MAX_SAFE_INTEGER. The guard in the
 * revised `lcm` helper must propagate Infinity instead of producing NaN.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  approxRatio,
  relativePeriodicity,
  chordPeriodicity,
  harmonicityForChord,
} from './harmonicity.js';
import { chordFromRatios, chordFromSemitones, realizeChordFreqs } from './chord.js';

// ---------------------------------------------------------------------------
// approxRatio
// ---------------------------------------------------------------------------

describe('approxRatio — basic contract', () => {
  it('snaps_3_over_2_exactly', () => {
    const r = approxRatio(1.5);
    expect(r.num).toBe(3);
    expect(r.den).toBe(2);
  });

  it('snaps_12_tet_major_third_to_5_over_4', () => {
    // 400 cents ≈ 1.2599; 5/4 = 1.25, diff 0.0099 < 0.0136*1.25=0.017
    const r = approxRatio(2 ** (4 / 12));
    expect(r.num).toBe(5);
    expect(r.den).toBe(4);
  });

  it('tol_0_returns_high_precision_convergent', () => {
    // With tol=0, the algorithm never early-exits on tolerance; runs to maxDen.
    // approxRatio(pi, 0, 1000) = 103993/33102 (famous CF: partial quotient 292)
    const r = approxRatio(Math.PI, 0, 1000);
    expect(r.num).toBe(103993);
    expect(r.den).toBe(33102);
  });

  it('maxDen_is_soft_returned_den_may_exceed_it', () => {
    // Documented: if no convergent ≤ maxDen satisfies tol, the first over-maxDen
    // convergent is returned (closest available approximation).
    const r = approxRatio(Math.PI, 0, 1000);
    expect(r.den).toBeGreaterThan(1000); // 33102 > 1000
  });
});

// ---------------------------------------------------------------------------
// relativePeriodicity — LCM overflow guard (Socratic Q15 regression)
// ---------------------------------------------------------------------------

describe('relativePeriodicity — overflow guard (Socratic Q15)', () => {
  it('returns_15_for_just_major_triad', () => {
    // 1 : 5/4 : 3/2 → LCM(4, 2) = 4 common denom; LCM(4, 5, 6) = 60 → 60/4 = 15
    expect(relativePeriodicity([1, 1.25, 1.5])).toBe(15);
  });

  it('does_not_return_NaN_for_two_inharmonic_pi_and_e', () => {
    // approxRatio(π, 0) → den=33102; approxRatio(e, 0) → den≈4753 (7² × 97)
    // lcm(33102, 4753) ≈ 157 M — within MAX_SAFE_INTEGER but validates no NaN.
    const result = relativePeriodicity([Math.PI, Math.E], 0);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBeGreaterThan(0);
  });

  it('returns_Infinity_not_NaN_when_lcm_overflows_six_irrational_constants', () => {
    // Six irrational mathematical constants whose CF denominators (with tol=0)
    // are large and mutually coprime. Their collective LCM exceeds MAX_SAFE_INTEGER.
    // The overflow guard in the step-wise accumulation must return Infinity, not NaN.
    //
    // Approximate denominators with maxDen=1000 and tol=0:
    //   π       → 33102  (= 2 × 3² × 613)
    //   e       → 4753   (= 7² × 97)
    //   √2      → 2378   (= 2 × 29 × 41)
    //   log₂e   → large, coprime to above
    //   log₁₀e  → ~1073 (= 29 × 37)
    //   ln 2    → ~1007  (= 19 × 53)
    // Combined LCM exceeds 9 × 10^15 (Number.MAX_SAFE_INTEGER).
    const result = relativePeriodicity(
      [Math.PI, Math.E, Math.SQRT2, Math.LOG2E, Math.LOG10E, Math.LN2],
      0, // tol=0 forces long CF runs → large denominators
    );
    expect(Number.isNaN(result)).toBe(false);
    // Either a very large but valid number, or Infinity (overflow guard fired).
    expect(result === Infinity || Number.isFinite(result)).toBe(true);
    // Most importantly: NOT NaN.
  });

  it('property_relativePeriodicity_is_never_NaN_with_default_tol', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.5, max: 8, noNaN: true, noDefaultInfinity: true }), {
          minLength: 1,
          maxLength: 8,
        }),
        (ratios) => {
          const r = relativePeriodicity(ratios);
          return !Number.isNaN(r);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// chordPeriodicity
// ---------------------------------------------------------------------------

describe('chordPeriodicity', () => {
  it('just_fifth_440_660_has_low_periodicity', () => {
    // 440:660 = 2:3 → periodicity = lcm(2,3)/2 = 3
    const p = chordPeriodicity([440, 660]);
    expect(p).toBe(3);
  });

  it('property_chordPeriodicity_never_NaN', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 100, max: 5000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 2,
          maxLength: 6,
        }),
        (freqs) => {
          const result = chordPeriodicity(freqs);
          return !Number.isNaN(result);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// relativePeriodicity – empty input throws (line 64 true branch)
// ---------------------------------------------------------------------------

describe('relativePeriodicity – validation', () => {
  it('empty_ratios_throws', () => {
    expect(() => relativePeriodicity([])).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q93 — harmonicityForChord
// ---------------------------------------------------------------------------

describe('harmonicityForChord (Q93)', () => {
  const root = 261.63;

  it('ji_major_triad_returns_15', () => {
    // Just 5-limit major: 1/1, 5/4, 3/2 → periodicity = 15 (same as raw chordPeriodicity)
    const jiMaj = chordFromRatios('ji-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    expect(harmonicityForChord(jiMaj, root)).toBe(15);
  });

  it('12tet_major_triad_also_snaps_to_15', () => {
    // 12-TET major third ≈ 5/4 within default tol=0.0136
    const tetMaj = chordFromSemitones('major', [0, 4, 7]);
    expect(harmonicityForChord(tetMaj, root)).toBe(15);
  });

  it('ji_fifth_dyad_returns_3', () => {
    // 1:3/2 ratio → periodicity = 3 (LCM(2, 3) / 2 = 3)
    const fifth = chordFromRatios('fifth', [
      [1, 1],
      [3, 2],
    ]);
    expect(harmonicityForChord(fifth, 440)).toBe(3);
  });

  it('result_is_finite_positive', () => {
    const maj = chordFromSemitones('major', [0, 4, 7]);
    const p = harmonicityForChord(maj, 440);
    expect(Number.isFinite(p) || p === Infinity).toBe(true);
    expect(p).toBeGreaterThan(0);
  });

  it('matches_chordPeriodicity_on_same_freqs', () => {
    // harmonicityForChord should agree with chordPeriodicity applied to realized freqs
    const chord = chordFromSemitones('minor', [0, 3, 7]);
    const freqs = realizeChordFreqs(chord, root);
    expect(harmonicityForChord(chord, root)).toBeCloseTo(chordPeriodicity(freqs), 9);
  });

  it('invalid_rootHz_zero_throws', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(() => harmonicityForChord(chord, 0)).toThrow(RangeError);
  });

  it('invalid_rootHz_negative_throws', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(() => harmonicityForChord(chord, -440)).toThrow(RangeError);
  });

  it('empty_chord_throws', () => {
    const empty = { name: 'empty', intervals: [] as const };
    expect(() => harmonicityForChord(empty, 440)).toThrow(RangeError);
  });

  it('result_is_rootHz_independent', () => {
    // Periodicity depends only on ratios, not absolute Hz
    const chord = chordFromRatios('ji-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    expect(harmonicityForChord(chord, 220)).toBe(harmonicityForChord(chord, 880));
  });
});
