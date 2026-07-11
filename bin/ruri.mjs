#!/usr/bin/env node
/**
 * Thin Node bootstrap for the Ruri CLI.
 *
 * All command logic lives in the portable, fully-tested `runCli` (dist/cli.js);
 * this file only supplies the real filesystem / process I/O and maps the
 * returned exit code onto `process.exit`. Keeping the fs/process glue out of the
 * TypeScript sources lets the library stay dependency-free and node-type-free.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { runCli } from '../dist/cli.js';

const io = {
  readText: (path) => readFileSync(path, 'utf8'),
  writeText: (path, data) => writeFileSync(path, data),
  writeBytes: (path, data) => writeFileSync(path, data),
  out: (line) => process.stdout.write(line + '\n'),
  err: (line) => process.stderr.write(line + '\n'),
};

process.exit(runCli(process.argv.slice(2), io));
