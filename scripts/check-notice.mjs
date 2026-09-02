/**
 * NOTICE must list every bundled tuning, with the citation and licence the code
 * already demands of it.
 *
 * `loadTuningPreset` refuses a preset without a citation and a licence, and a
 * measured one without cultural context — provenance is enforced at load time.
 * NOTICE is where that provenance reaches a reader, and it ships in the tarball.
 * When it was written by hand it fell behind: it listed 5 tunings while the
 * package shipped 12, so seven were bundled with their attribution enforced in
 * code and absent from the notice.
 *
 * So it is generated from `loadAll(ALL_PRESETS)` — the same source of truth the
 * loader validates — rather than kept in step by remembering to.
 *
 * Usage:
 *   node scripts/check-notice.mjs          verify NOTICE is current (exit 1 if not)
 *   node scripts/check-notice.mjs --write  regenerate the table in place
 *
 * Requires `npm run build`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const NOTICE = `${ROOT}NOTICE`;
const START = '<!-- BEGIN GENERATED TUNING TABLE -->';
const END = '<!-- END GENERATED TUNING TABLE -->';

if (!existsSync(`${ROOT}dist/data/index.js`)) {
  console.error('check-notice: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const { ALL_PRESETS } = await import(`${ROOT}dist/data/presets.js`);
const { loadAll } = await import(`${ROOT}dist/data/tuning-data.js`);
const { attributions } = loadAll(ALL_PRESETS);

const escape = (s) => String(s).replace(/\|/g, '\\|');
const rows = ALL_PRESETS.map((p, i) => {
  void attributions[i]; // the same strings, laid out as a table for readers
  const context = p.source === 'measured' ? ` — ${p.region ?? 'region unrecorded'}` : '';
  return `| ${escape(p.name)}${escape(context)} | ${escape(p.provenance.citation)} | ${escape(p.provenance.license)} |`;
});
const table = [
  START,
  '',
  '| Tuning | Source | License |',
  '|--------|--------|---------|',
  ...rows,
  '',
  END,
].join('\n');

const notice = readFileSync(NOTICE, 'utf8');
if (!notice.includes(START) || !notice.includes(END)) {
  console.error(`check-notice: NOTICE is missing the ${START} / ${END} markers.`);
  process.exit(1);
}
const updated = notice.replace(
  new RegExp(`${START}[\\s\\S]*?${END}`),
  () => table,
);

if (process.argv.includes('--write')) {
  writeFileSync(NOTICE, updated);
  console.log(`check-notice: NOTICE regenerated with ${ALL_PRESETS.length} tunings.`);
  process.exit(0);
}
if (updated !== notice) {
  console.error('NOTICE is out of date with the bundled presets.');
  console.error('Run `node scripts/check-notice.mjs --write` to regenerate it.\n');
  const bundled = new Set(ALL_PRESETS.map((p) => p.name));
  for (const name of bundled) {
    if (!notice.includes(name)) console.error(`  missing attribution: ${name}`);
  }
  process.exit(1);
}
console.log(`check-notice: NOTICE lists all ${ALL_PRESETS.length} bundled tunings.`);
