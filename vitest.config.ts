import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Excludes stray git worktrees left under .claude/worktrees/ (created by
    // agent sessions in this environment) whose own test files would
    // otherwise be picked up alongside the real src/ tree.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.ts'],
      // The gate guards hand-written code. scale.ts and presets.ts are
      // machine-generated, are not part of the public API, and no longer have
      // a runnable suite of their own — including them measured the generator,
      // not the project, and was why this gate read ~36% and was ignored.
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/core/scale.ts', 'src/data/presets.ts'],
      thresholds: {
        lines: 95,
        functions: 98,
        branches: 90,
        statements: 95,
      },
    },
  },
});
