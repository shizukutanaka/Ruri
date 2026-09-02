/**
 * Typecheck every ```ts fenced block in README.md against the real source.
 *
 * A broken example is a broken promise: it is the first code a new user runs,
 * and nothing else in the pipeline looks at it. Four of fifteen blocks did not
 * compile when this check was written — missing imports and undefined
 * variables that would have thrown ReferenceError on the first line executed.
 *
 * Blocks are compiled individually against `src/` (not `dist/`), so this needs
 * no build step. `ruri`, `ruri/core`, `ruri/adapters` and `ruri/data` are
 * mapped to their entry points via tsconfig `paths`.
 *
 * Usage: node scripts/check-readme-examples.mjs
 * Exit 0 if every block compiles, 1 otherwise.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const README = join(ROOT, 'README.md');

/** Extract fenced ts/js blocks as { startLine, code }. */
function extractBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let current = null;
  let lang = '';
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (current === null) {
        lang = line.slice(3).trim();
        current = [];
        start = i + 1;
      } else {
        if (['ts', 'typescript', 'js', 'javascript'].includes(lang)) {
          blocks.push({ startLine: start, code: current.join('\n') });
        }
        current = null;
      }
    } else if (current !== null) {
      current.push(line);
    }
  }
  return blocks;
}

const blocks = extractBlocks(readFileSync(README, 'utf8'));
if (blocks.length === 0) {
  console.error('check-readme-examples: no ts blocks found — has README.md moved?');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'ruri-readme-'));
const failures = [];
try {
  // Examples may write files, but the repo deliberately carries no @types/node
  // (src/ must stay runtime-agnostic — see src/core/CLAUDE.md), so declare the
  // handful of builtins the README touches instead of taking on the dependency.
  // Only the shapes the examples actually use are declared; the point of this
  // check is ruri's own API surface, not Node's.
  writeFileSync(
    join(dir, 'node-builtins.d.ts'),
    [
      "declare module 'node:fs/promises' {",
      '  export function writeFile(path: string, data: string | Uint8Array): Promise<void>;',
      '  export function readFile(path: string, encoding: string): Promise<string>;',
      '}',
    ].join('\n'),
  );
  for (const [i, { startLine, code }] of blocks.entries()) {
    const file = join(dir, `block${i}.ts`);
    writeFileSync(file, `${code}\nexport {};\n`);
    const config = join(dir, `tsconfig${i}.json`);
    writeFileSync(
      config,
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          noUnusedLocals: false,
          baseUrl: ROOT,
          paths: {
            ruri: ['src/index.ts'],
            'ruri/core': ['src/core/index.ts'],
            'ruri/adapters': ['src/adapters/index.ts'],
            'ruri/data': ['src/data/index.ts'],
          },
        },
        files: [file, join(dir, 'node-builtins.d.ts')],
      }),
    );
    try {
      execFileSync('npx', ['tsc', '-p', config], { cwd: ROOT, stdio: 'pipe' });
    } catch (e) {
      const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
      failures.push({ startLine, out });
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  for (const { startLine, out } of failures) {
    console.error(`\nREADME.md:${startLine} — example does not compile:`);
    console.error(out.replace(/^/gm, '  '));
  }
  console.error(`\n${failures.length} of ${blocks.length} README examples failed.`);
  process.exit(1);
}
console.log(`check-readme-examples: all ${blocks.length} README examples compile.`);
