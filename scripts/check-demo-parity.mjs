/**
 * The offline demo reimplements the library's scorers. Prove they still agree.
 *
 * `shell-web/index.html` is a single self-contained page with no build step, so
 * it cannot import the package — it carries its own inline copies of Sethares
 * roughness, Stolzenburg periodicity and the continued-fraction ratio search.
 * That is a defensible constraint and an undefensible risk: a second
 * implementation of the exact scorers the library exists to provide, able to
 * drift from them silently and show visitors numbers the library disagrees with.
 *
 * So the functions are extracted from the HTML *as shipped* and run against the
 * library on the same inputs. Nothing is copied into this file — a third copy
 * would be one more thing to drift.
 *
 * Requires `npm run build`.
 * Usage: node scripts/check-demo-parity.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const PAGE = `${ROOT}shell-web/index.html`;

if (!existsSync(`${ROOT}dist/index.js`)) {
  console.error('check-demo-parity: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(PAGE, 'utf8');

/** Pull one `function name(...)  ... }` out of the page by brace matching. */
function extract(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`check-demo-parity: ${name}() not found in shell-web/index.html`);
  let depth = 0;
  let i = html.indexOf('{', start);
  const from = i;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`check-demo-parity: ${name}() is unterminated`);
}

const NAMES = ['dissPair', 'chordRoughness', 'approxRatio', 'gcd', 'lcm', 'periodicity'];
const demo = new Function(
  `${NAMES.map(extract).join('\n')}\nreturn { ${NAMES.join(', ')} };`,
)();

const { chordDissonance, harmonicSpectrum, chordPeriodicity, approxRatio } = await import(
  `${ROOT}dist/index.js`
);

const spectrum = harmonicSpectrum();
const demoSpectrum = spectrum.map((p) => ({ ratio: p.ratio, amp: p.amplitude }));
const CHORDS = [
  ['just major 4:5:6', [440, 550, 660]],
  ['just minor 10:12:15', [440, 528, 660]],
  ['semitone cluster', [440, 466.16, 493.88]],
  ['pure fifth', [440, 660]],
  ['harmonic seventh 4:5:6:7', [440, 550, 660, 770]],
  ['12-TET major', [440, 554.37, 659.26]],
];

const failures = [];
const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

for (const [label, freqs] of CHORDS) {
  const lib = chordDissonance(freqs, spectrum);
  const web = demo.chordRoughness(freqs, demoSpectrum);
  if (!near(lib, web)) failures.push(`roughness ${label}: library ${lib}, demo ${web}`);

  const libP = chordPeriodicity(freqs, 0.0136);
  const webP = demo.periodicity(freqs.map((f) => f / freqs[0]));
  if (!near(libP, webP)) failures.push(`periodicity ${label}: library ${libP}, demo ${webP}`);
}

for (const x of [1.5, 1.25, 1.26, 1.3333333, 1.4983, 2, 1.0595]) {
  const lib = approxRatio(x, 0.0136, 1000);
  const [n, d] = demo.approxRatio(x);
  if (lib.num !== n || lib.den !== d) {
    failures.push(`approxRatio(${x}): library ${lib.num}/${lib.den}, demo ${n}/${d}`);
  }
}

if (failures.length > 0) {
  console.error('shell-web/index.html has drifted from the library:\n');
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\n${failures.length} disagreement(s). The demo shows numbers the library denies.`);
  process.exit(1);
}
console.log(
  `check-demo-parity: shell-web agrees with the library on ${CHORDS.length} chords and 7 ratios.`,
);
