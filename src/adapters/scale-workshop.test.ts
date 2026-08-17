import { describe, it, expect } from 'vitest';
import { parseScaleWorkshop, parseScaleWorkshopLine } from './scale-workshop.js';
import { degreeToCents } from '../core/tuning.js';
import { pitchToCents } from '../core/cents.js';

const centsOf = (line: string): number => pitchToCents(parseScaleWorkshopLine(line).pitch);

describe('parseScaleWorkshopLine — the four notations', () => {
  it('test_ratios_are_kept_exact', () => {
    const fifth = parseScaleWorkshopLine('3/2');
    expect(fifth.form).toBe('ratio');
    expect(fifth.pitch.kind).toBe('ratio');
    if (fifth.pitch.kind === 'ratio') {
      expect(fifth.pitch.ratio.num).toBe(3);
      expect(fifth.pitch.ratio.den).toBe(2);
    }
    expect(centsOf('3/2')).toBeCloseTo(701.9550008654, 8);
  });

  it('test_a_bare_integer_is_a_ratio_over_one', () => {
    const octave = parseScaleWorkshopLine('2');
    expect(octave.form).toBe('ratio');
    expect(centsOf('2')).toBeCloseTo(1200, 9);
  });

  it('test_a_dot_makes_the_line_cents', () => {
    expect(parseScaleWorkshopLine('701.9').form).toBe('cents');
    expect(centsOf('701.9')).toBeCloseTo(701.9, 9);
    expect(centsOf('1200.')).toBeCloseTo(1200, 9);
  });

  it('test_the_dot_is_the_only_thing_separating_an_octave_from_two_cents', () => {
    // The discriminator that matters: `2` is 1200 cents, `2.` is 2 cents.
    expect(centsOf('2')).toBeCloseTo(1200, 9);
    expect(centsOf('2.')).toBeCloseTo(2, 9);
  });

  it('test_backslash_is_a_step_of_an_edo', () => {
    expect(parseScaleWorkshopLine('7\\12').form).toBe('edostep');
    expect(centsOf('7\\12')).toBeCloseTo(700, 9);
    expect(centsOf('12\\12')).toBeCloseTo(1200, 9);
    expect(centsOf('1\\19')).toBeCloseTo(1200 / 19, 9);
  });

  it('test_trailing_e_marks_a_decimal_ratio', () => {
    expect(parseScaleWorkshopLine('1.5e').form).toBe('decimal');
    // 1.5 as a ratio is the just fifth.
    expect(centsOf('1.5e')).toBeCloseTo(701.9550008654, 8);
    // Scientific form: 14e-1 is 1.4.
    expect(centsOf('14e-1')).toBeCloseTo(1200 * Math.log2(1.4), 8);
  });

  it('test_e_wins_over_the_dot_it_contains', () => {
    // '1.5e' has both markers; it is a decimal ratio, not 1.5 cents.
    expect(parseScaleWorkshopLine('1.5e').form).toBe('decimal');
    expect(centsOf('1.5e')).toBeGreaterThan(700);
  });

  it('test_rejects_unparseable_lines', () => {
    for (const bad of ['', '   ', 'abc', '3/0', '0/1', '1\\0', '-1e']) {
      expect(() => parseScaleWorkshopLine(bad)).toThrow(RangeError);
    }
  });
});

describe('parseScaleWorkshop — whole scales', () => {
  const JUST_MAJOR = '9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1';

  it('test_reads_a_just_major_scale_with_ratios_intact', () => {
    const t = parseScaleWorkshop(JUST_MAJOR);
    expect(t.periodCents).toBeCloseTo(1200, 9);
    expect(t.degrees).toHaveLength(7); // implied 1/1 plus six written degrees
    // The just third stays exact rather than becoming a rounded cents value.
    expect(t.degrees[2]!.kind).toBe('ratio');
    expect(degreeToCents(t, 2)).toBeCloseTo(386.3137138648, 8);
  });

  it('test_the_last_line_becomes_the_period_not_a_degree', () => {
    const t = parseScaleWorkshop(JUST_MAJOR);
    expect(t.periodCents).toBeCloseTo(1200, 9);
    for (const d of t.degrees) expect(pitchToCents(d)).toBeLessThan(1200);
  });

  it('test_reads_an_edo_written_in_step_notation', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => `${i + 1}\\12`).join('\n');
    const t = parseScaleWorkshop(twelve);
    expect(t.periodCents).toBeCloseTo(1200, 9);
    expect(t.degrees).toHaveLength(12);
    for (let i = 0; i < 12; i++) expect(degreeToCents(t, i)).toBeCloseTo(i * 100, 6);
  });

  it('test_supports_a_non_octave_period', () => {
    // Bohlen-Pierce: repeats at the tritave, written as a ratio.
    const bp = Array.from({ length: 13 }, (_, i) => `${i + 1}\\13`)
      .join('\n')
      .replace('13\\13', '3/1');
    const t = parseScaleWorkshop(bp);
    expect(t.periodCents).toBeCloseTo(1200 * Math.log2(3), 8);
  });

  it('test_mixed_notations_in_one_scale', () => {
    // Cents, ratio and EDO-step notations side by side, ascending.
    const t = parseScaleWorkshop('100.\n5/4\n7\\12\n2/1');
    expect(t.degrees).toHaveLength(4);
    expect(degreeToCents(t, 1)).toBeCloseTo(100, 9);
    expect(degreeToCents(t, 2)).toBeCloseTo(386.3137138648, 8);
    expect(degreeToCents(t, 3)).toBeCloseTo(700, 9);
    // The ratio line stayed a ratio; the others became cents.
    expect(t.degrees[2]!.kind).toBe('ratio');
    expect(t.degrees[3]!.kind).toBe('cents');
  });

  it('test_skips_blank_lines_and_comments', () => {
    const t = parseScaleWorkshop('! a comment\n\n3/2\n\n2/1\n');
    expect(t.degrees).toHaveLength(2);
    expect(t.periodCents).toBeCloseTo(1200, 9);
  });

  it('test_honours_id_name_and_reference', () => {
    const t = parseScaleWorkshop('3/2\n2/1', { id: 'mine', name: 'My Scale', referenceHz: 432 });
    expect(t.id).toBe('mine');
    expect(t.name).toBe('My Scale');
    expect(t.referenceHz).toBe(432);
  });

  it('test_rejects_empty_or_invalid_input', () => {
    expect(() => parseScaleWorkshop('')).toThrow(RangeError);
    expect(() => parseScaleWorkshop('! only comments')).toThrow(RangeError);
    expect(() => parseScaleWorkshop('3/2\nnonsense')).toThrow(RangeError);
  });
});
