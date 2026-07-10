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
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
