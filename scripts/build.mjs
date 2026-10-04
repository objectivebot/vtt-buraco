#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildTable } from './game/table.mjs';
import { vttArchive } from './lib/vtt-archive.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist/buraco.vtt');
const jsonOutput = resolve(root, 'dist/buraco.json');
const board = buildTable();
mkdirSync(dirname(output), { recursive: true });
writeFileSync(jsonOutput, JSON.stringify(board, null, 2) + '\n');
writeFileSync(output, vttArchive(board));
process.stdout.write(`Built ${output}: ${Object.values(board).filter(x=>x?.type === 'card').length} cards, ${Object.values(board).filter(x=>x?.type === 'seat').length} seats\n`);
