#!/usr/bin/env node
// One git repo holds both apps, so hooks live in <repo root>/.githooks and run `check` in each app.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
if (top.status !== 0) process.exit(0); // not in a git repo (tarball, CI cache): nothing to wire
const root = top.stdout.trim();
if (!existsSync(join(root, '.githooks'))) process.exit(0);

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root });
if (result.status !== 0) console.warn('setup-git-hooks: could not set core.hooksPath');
else console.log('setup-git-hooks: core.hooksPath = .githooks');
