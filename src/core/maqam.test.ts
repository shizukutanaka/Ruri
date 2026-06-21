import { describe, it, expect } from 'vitest';
import { jins, maqam, composeMaqam } from './maqam.js';

describe('jins', () => {
  it('test_rast_cents', () => {
    expect(jins('rast').cents).toEqual([0, 200, 350, 500]);
  });

  it('test_hijaz_cents', () => {
    expect(jins('hijaz').cents).toEqual([0, 100, 400, 500]);
  });

  it('test_bayati_cents', () => {
    expect(jins('bayati').cents).toEqual([0, 150, 350, 500]);
  });

  it('test_throws_on_unknown_name', () => {
    expect(() => jins('unknown' as 'rast')).toThrow(RangeError);
  });
});

describe('maqam', () => {
  it('test_rast_starts_at_zero', () => {
    expect(maqam('rast').cents[0]).toBe(0);
  });

  it('test_rast_ends_at_or_above_1200', () => {
    const m = maqam('rast');
    expect(m.cents[m.cents.length - 1]).toBeGreaterThanOrEqual(1200);
  });

  it('test_hijaz_contains_characteristic_intervals', () => {
    const m = maqam('hijaz');
    // Hijaz tetrachord has 100 and 400 in it
    expect(m.cents.some((c) => Math.abs(c - 100) < 1)).toBe(true);
    expect(m.cents.some((c) => Math.abs(c - 400) < 1)).toBe(true);
  });

  it('test_all_maqam_cents_sorted_and_start_at_zero', () => {
    const names = ['rast', 'bayati', 'hijaz', 'kurd', 'nahawand', 'saba'] as const;
    for (const name of names) {
      const m = maqam(name);
      expect(m.cents[0]).toBe(0);
      const sorted = [...m.cents].sort((a, b) => a - b);
      expect(m.cents).toEqual(sorted);
    }
  });

  it('test_throws_on_unknown_maqam', () => {
    expect(() => maqam('unknown' as 'rast')).toThrow(RangeError);
  });
});

describe('composeMaqam', () => {
  it('test_compose_rast_plus_rast', () => {
    const m = composeMaqam('test', jins('rast'), jins('rast'), 500);
    expect(m.cents[0]).toBe(0);
    expect(m.cents).toContain(200);
    expect(m.cents).toContain(350);
    expect(m.cents).toContain(500);
    // Upper rast shifted by 500: 500, 700, 850, 1000
    expect(m.cents).toContain(700);
    expect(m.cents).toContain(850);
    expect(m.cents).toContain(1000);
  });

  it('test_composed_cents_sorted', () => {
    const m = composeMaqam('test', jins('bayati'), jins('nahawand'), 500);
    const sorted = [...m.cents].sort((a, b) => a - b);
    expect(m.cents).toEqual(sorted);
  });

  it('test_compose_deduplicates', () => {
    // Both jins start at 0, so the join at their overlap should deduplicate 500
    const m = composeMaqam('test', jins('rast'), jins('rast'), 500);
    // 500 appears in lower.cents AND as upper.cents[0]+500=0+500=500, so only once
    const count500 = m.cents.filter((c) => c === 500).length;
    expect(count500).toBe(1);
  });
});
