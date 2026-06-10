/** One partial (overtone): frequency as a multiple of the fundamental, plus amplitude. */
export interface Partial {
  readonly ratio: number;
  readonly amplitude: number;
}

export type Spectrum = readonly Partial[];

/** Harmonic spectrum: partials at integer multiples, amplitude rolling off. */
export function harmonicSpectrum(n = 6, rolloff = 0.88): Spectrum {
  return Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return { ratio: k, amplitude: rolloff ** (k - 1) };
  });
}

/** Piano-like stretched spectrum (Railsback-style inharmonicity coefficient B). */
export function stretchedSpectrum(n = 6, b = 0.0004, rolloff = 0.88): Spectrum {
  return Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return { ratio: k * Math.sqrt(1 + b * k * k), amplitude: rolloff ** (k - 1) };
  });
}

/** Inharmonic spectrum (bell / metallophone). Partials do not follow the harmonic series. */
export function bellSpectrum(): Spectrum {
  const ratios = [1, 2.76, 5.4, 8.93, 11.34, 16.0];
  return ratios.map((r, i) => ({ ratio: r, amplitude: 0.88 ** i }));
}

export interface RealizedPartial {
  readonly freq: number;
  readonly amp: number;
}

/** Place a spectrum at an absolute fundamental frequency. */
export function realizeSpectrum(
  spectrum: Spectrum,
  fundamentalHz: number,
  gain = 1,
): RealizedPartial[] {
  return spectrum.map((p) => ({ freq: fundamentalHz * p.ratio, amp: p.amplitude * gain }));
}
