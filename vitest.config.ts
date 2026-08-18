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
      // Every file under src/ is now reachable code, so every file is
      // measured. The earlier carve-out for scale.ts and presets.ts existed
      // only because they were 119,000 lines of unreachable generated bulk.
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 95,
        functions: 98,
        branches: 90,
        statements: 95,
      },
    },
  },
});
