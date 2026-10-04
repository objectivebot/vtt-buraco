#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vttArchive } from './lib/vtt-archive.mjs';
import { buildM0Probe } from './game/m0-probe.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist/m0-probe.vtt');
const data = buildM0Probe();
mkdirSync(dirname(output), { recursive: true });
writeFileSync(resolve(root,'dist/m0-probe.json'), JSON.stringify(data, null, 2) + '\n');
writeFileSync(output, vttArchive(data));
console.log('Built', output);
