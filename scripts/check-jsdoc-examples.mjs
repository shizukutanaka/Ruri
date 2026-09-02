/**
 * Every exported function carrying a JSDoc `@example` must either be reachable
 * by a consumer or be marked `@internal`.
 *
 * The package `exports` map offers exactly four entry points — `ruri`,
 * `ruri/core`, `ruri/adapters`, `ruri/data` — and deep paths are blocked
 * (`ERR_PACKAGE_PATH_NOT_EXPORTED`). So an `@example` on a function that no
 * barrel re-exports documents an API nobody can call. Twenty-five functions in
 * scale.ts were in that state when this check was written: internal helpers
 * advertising themselves in editor tooltips as though they were public.
 *
 * This does not force everything to be public. Marking a function `@internal`
 * is the other valid answer, and the common one — it keeps the example useful
 * for maintainers while telling readers and API-extractor tooling the truth.
 *
 * Requires `npm run build` first (it reads the built barrels to learn the real
 * public surface, rather than re-deriving it from the source).
 *
 * Usage: node scripts/check-jsdoc-examples.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

if (!existsSync(join(DIST, 'index.js'))) {
  console.error('check-jsdoc-examples: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const api = new Set();
for (const entry of ['index.js', 'core/index.js', 'adapters/index.js', 'data/index.js']) {
  const mod = await import(join(DIST, entry));
  for (const name of Object.keys(mod)) api.add(name);
}

/** Every non-test .ts file under src/. */
function sources(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sources(full));
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of sources(join(ROOT, 'src'))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const decl = /^export (?:async )?function (\w+)/.exec(lines[i]);
    if (decl === null) continue;
    const name = decl[1];
    if (api.has(name)) continue;
    // Walk back over the JSDoc block immediately above the declaration.
    let j = i - 1;
    const block = [];
    while (j >= 0 && (lines[j].trim().startsWith('*') || lines[j].trim() === '')) {
      block.unshift(lines[j]);
      if (lines[j].trim().startsWith('/**')) break;
      j--;
    }
    const doc = block.join('\n');
    if (doc.includes('@example') && !doc.includes('@internal')) {
      offenders.push(`${relative(ROOT, file)}:${i + 1}  ${name}`);
    }
  }
}

if (offenders.length > 0) {
  console.error('These functions carry an @example but no consumer can import them.');
  console.error('Add them to a barrel, or mark the JSDoc @internal:\n');
  for (const o of offenders) console.error(`  ${o}`);
  console.error(`\n${offenders.length} unreachable documented function(s).`);
  process.exit(1);
}
console.log(`check-jsdoc-examples: every documented function is reachable or marked @internal.`);
