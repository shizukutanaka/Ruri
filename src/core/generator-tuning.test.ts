import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  optimalGenerator,
  generatorError,
  MEANTONE_5_LIMIT,
  type TemperamentTarget,
} from './generator-tuning.js';

const PURE_FIFTH = 1200 * Math.log2(3 / 2); // 701.955001c
const PURE_THIRD = 1200 * Math.log2(5 / 4); // 386.313714c
const QUARTER_COMMA_FIFTH = (1200 * Math.log2(5)) / 4; // 696.578428c

const ONLY_FIFTH: TemperamentTarget[] = [{ num: 3, den: 2, periods: 0, generators: 1 }];
const ONLY_THIRD: TemperamentTarget[] = [{ num: 5, den: 4, periods: -2, generators: 4 }];

describe('optimalGenerator — reproduces tunings with known values', () => {
  it('test_optimising_for_the_fifth_alone_gives_the_pure_fifth', () => {
    const r = optimalGenerator(ONLY_FIFTH);
    expect(r.generatorCents).toBeCloseTo(PURE_FIFTH, 9);
    expect(r.maxErrorCents).toBeCloseTo(0, 9);
  });

  it('test_optimising_for_the_third_alone_gives_quarter_comma_meantone', () => {
    // Quarter-comma meantone exists precisely to make 5/4 pure. Derived here by
    // least squares; temperament.ts derives the same number as 3/2 − syntonic/4.
    const r = optimalGenerator(ONLY_THIRD);
    expect(r.generatorCents).toBeCloseTo(QUARTER_COMMA_FIFTH, 9);
    expect(r.generatorCents).toBeCloseTo(PURE_FIFTH - (1200 * Math.log2(81 / 80)) / 4, 9);
    expect(r.maxErrorCents).toBeCloseTo(0, 9);
  });

  it('test_quarter_comma_meantone_really_yields_a_pure_major_third', () => {
    // Four of its fifths, less two octaves, land exactly on 5/4.
    const g = optimalGenerator(ONLY_THIRD).generatorCents;
    expect(4 * g - 2400).toBeCloseTo(PURE_THIRD, 9);
  });

  it('test_a_single_target_is_always_matched_exactly', () => {
    // One target, one free parameter — the fit is exact.
    for (const t of [
      { num: 7, den: 4, periods: 0, generators: 1 },
      { num: 5, den: 4, periods: -2, generators: 4 },
      { num: 3, den: 2, periods: 1, generators: -2 },
    ]) {
      expect(optimalGenerator([t]).maxErrorCents).toBeCloseTo(0, 9);
    }
  });
});

describe('optimalGenerator — compromise between competing targets', () => {
  it('test_meantone_fifth_lies_between_the_two_single_target_optima', () => {
    // Serving both 3/2 and 5/4 must land strictly between serving either alone.
    const g = optimalGenerator(MEANTONE_5_LIMIT).generatorCents;
    expect(g).toBeGreaterThan(QUARTER_COMMA_FIFTH);
    expect(g).toBeLessThan(PURE_FIFTH);
  });

  it('test_neither_target_is_pure_in_the_compromise', () => {
    const r = optimalGenerator(MEANTONE_5_LIMIT);
    for (const t of r.targets) expect(Math.abs(t.errorCents)).toBeGreaterThan(0);
    expect(r.maxErrorCents).toBeLessThan(6); // but both stay close
  });

  it('test_the_optimum_beats_every_alternative_generator', () => {
    // The defining property of an optimum, checked against a dense sweep.
    const best = optimalGenerator(MEANTONE_5_LIMIT);
    const bestErr = generatorError(best.generatorCents, MEANTONE_5_LIMIT);
    for (let g = 680; g <= 710; g += 0.25) {
      expect(generatorError(g, MEANTONE_5_LIMIT)).toBeGreaterThanOrEqual(bestErr - 1e-9);
    }
    // Including the two tunings people actually use.
    expect(generatorError(700, MEANTONE_5_LIMIT)).toBeGreaterThan(bestErr);
    expect(generatorError(PURE_FIFTH, MEANTONE_5_LIMIT)).toBeGreaterThan(bestErr);
  });

  it('test_weighting_choice_changes_the_answer', () => {
    // Tenney weighting favours the simpler 3/2, pulling the fifth wider than an
    // equal-weighted fit does.
    const tenney = optimalGenerator(MEANTONE_5_LIMIT, { weighting: 'tenney' }).generatorCents;
    const equal = optimalGenerator(MEANTONE_5_LIMIT, { weighting: 'equal' }).generatorCents;
    expect(tenney).not.toBeCloseTo(equal, 6);
    expect(tenney).toBeGreaterThan(equal);
  });
});

describe('optimalGenerator — structure and reporting', () => {
  it('test_reports_per_target_detail_consistently', () => {
    const r = optimalGenerator(MEANTONE_5_LIMIT);
    expect(r.targets).toHaveLength(2);
    for (const t of r.targets) {
      expect(t.errorCents).toBeCloseTo(t.temperedCents - t.justCents, 9);
      expect(t.weight).toBeGreaterThan(0);
    }
    expect(r.maxErrorCents).toBeCloseTo(
      Math.max(...r.targets.map((t) => Math.abs(t.errorCents))),
      9,
    );
  });

  it('test_supports_a_non_octave_period', () => {
    // Bohlen-Pierce territory: a tritave period with 5/3 as the generator target.
    const tritave = 1200 * Math.log2(3);
    const r = optimalGenerator([{ num: 5, den: 3, periods: 0, generators: 1 }], {
      periodCents: tritave,
    });
    expect(r.generatorCents).toBeCloseTo(1200 * Math.log2(5 / 3), 9);
  });

  it('test_rejects_invalid_input', () => {
    expect(() => optimalGenerator([])).toThrow(RangeError);
    expect(() => optimalGenerator(ONLY_FIFTH, { periodCents: 0 })).toThrow(RangeError);
    expect(() => optimalGenerator([{ num: 0, den: 1, periods: 0, generators: 1 }])).toThrow(
      RangeError,
    );
    expect(() => optimalGenerator([{ num: 3, den: 2, periods: 0.5, generators: 1 }])).toThrow(
      RangeError,
    );
    // A target reached without the generator leaves it unconstrained.
    expect(() => optimalGenerator([{ num: 2, den: 1, periods: 1, generators: 0 }])).toThrow(
      RangeError,
    );
  });

  it('property_the_closed_form_is_a_true_minimum', () => {
    // For any mapping, nudging the generator either way must not reduce error.
    fc.assert(
      fc.property(
        fc.integer({ min: -6, max: 6 }).filter((b) => b !== 0),
        fc.integer({ min: -4, max: 4 }),
        (generators, periods) => {
          const targets: TemperamentTarget[] = [
            { num: 3, den: 2, periods: 0, generators: 1 },
            { num: 5, den: 4, periods, generators },
          ];
          const best = optimalGenerator(targets);
          const e0 = generatorError(best.generatorCents, targets);
          expect(generatorError(best.generatorCents + 0.5, targets)).toBeGreaterThanOrEqual(
            e0 - 1e-9,
          );
          expect(generatorError(best.generatorCents - 0.5, targets)).toBeGreaterThanOrEqual(
            e0 - 1e-9,
          );
        },
      ),
    );
  });
});

describe('generatorError', () => {
  it('test_is_zero_for_a_generator_that_hits_its_target', () => {
    expect(generatorError(PURE_FIFTH, ONLY_FIFTH)).toBeCloseTo(0, 9);
    expect(generatorError(QUARTER_COMMA_FIFTH, ONLY_THIRD)).toBeCloseTo(0, 9);
  });

  it('test_grows_as_the_generator_moves_away', () => {
    const at = generatorError(PURE_FIFTH, ONLY_FIFTH);
    expect(generatorError(PURE_FIFTH + 5, ONLY_FIFTH)).toBeGreaterThan(at);
    expect(generatorError(PURE_FIFTH - 5, ONLY_FIFTH)).toBeGreaterThan(at);
  });

  it('test_rejects_invalid_input', () => {
    expect(() => generatorError(Number.NaN, ONLY_FIFTH)).toThrow(RangeError);
    expect(() => generatorError(700, [])).toThrow(RangeError);
  });
});

describe('optimalGenerator — weighting and degenerate targets', () => {
  // Meantone: 3/2 is one generator; 5/4 is four generators less two periods.
  const meantone = [
    { num: 3, den: 2, periods: 0, generators: 1 },
    { num: 5, den: 4, periods: -2, generators: 4 },
  ];

  it('test_tenney_and_equal_weighting_choose_different_generators', () => {
    // Verified numerically. Tenney weights the simpler ratio more heavily
    // (3/2 gets 0.387 against 5/4's 0.231), so it pulls the generator toward a
    // purer fifth; equal weighting treats both alike and lands nearer the
    // quarter-comma value of 696.578c.
    const tenney = optimalGenerator(meantone);
    const equal = optimalGenerator(meantone, { weighting: 'equal' });
    expect(tenney.generatorCents).toBeCloseTo(697.378, 3);
    expect(equal.generatorCents).toBeCloseTo(696.895, 3);
    expect(equal.generatorCents).toBeLessThan(tenney.generatorCents);
  });

  it('test_equal_weighting_reports_unit_weights', () => {
    for (const t of optimalGenerator(meantone, { weighting: 'equal' }).targets) {
      expect(t.weight).toBe(1);
    }
  });

  it('test_each_weighting_minimises_its_own_error_measure', () => {
    // The defining property: neither answer is "better" outright — each is
    // optimal under its own weighting, so each beats the other on its own turf.
    const tenney = optimalGenerator(meantone).generatorCents;
    const equal = optimalGenerator(meantone, { weighting: 'equal' }).generatorCents;
    expect(generatorError(tenney, meantone)).toBeLessThan(generatorError(equal, meantone));
    expect(generatorError(equal, meantone, { weighting: 'equal' })).toBeLessThan(
      generatorError(tenney, meantone, { weighting: 'equal' }),
    );
  });

  it('test_a_unison_target_is_refused_rather_than_returning_NaN', () => {
    // Tenney weight is 1/log2(num*den) and the unison's Tenney height is zero,
    // so weighting it divided by zero and every result came back NaN — silently.
    // A unison is not a tuning target: there is nothing about 1/1 to approximate.
    const unison = [{ num: 1, den: 1, periods: 0, generators: 1 }];
    expect(() => optimalGenerator(unison)).toThrow(RangeError);
    expect(() => generatorError(700, unison)).toThrow(RangeError);
    expect(() => optimalGenerator([{ num: 2, den: 2, periods: 0, generators: 1 }])).toThrow(
      RangeError,
    );
  });

  it('test_an_empty_target_list_is_refused', () => {
    expect(() => optimalGenerator([])).toThrow(RangeError);
    expect(() => generatorError(700, [])).toThrow(RangeError);
  });
});
