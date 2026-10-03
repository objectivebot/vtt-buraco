import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
const archive = readFileSync(resolve('dist/buraco.vtt'));
function extractSingleVttJson(zip) {
  assert.equal(zip.readUInt32LE(0), 0x04034b50, 'must start with ZIP local file header');
  const compression = zip.readUInt16LE(8);
  assert.equal(compression, 8, 'must use DEFLATE');
  const nameLength = zip.readUInt16LE(26);
  const extraLength = zip.readUInt16LE(28);
  const fileName = zip.toString('utf8', 30, 30 + nameLength);
  assert.equal(fileName, '0.json', 'importer expects top-level JSON inside ZIP');
  const start = 30 + nameLength + extraLength;
  const compressed = zip.subarray(start, start + zip.readUInt32LE(18));
  const data = inflateRawSync(compressed);
  assert.equal(data.length, zip.readUInt32LE(22));
  const central = start + compressed.length;
  assert.equal(zip.readUInt32LE(central), 0x02014b50);
  const end = central + 46 + nameLength;
  assert.equal(zip.readUInt32LE(end), 0x06054b50);
  assert.equal(zip.readUInt16LE(end + 10), 1);
  return JSON.parse(data.toString('utf8'));
}
const board = extractSingleVttJson(archive);
const widgets = Object.values(board);
const cards = widgets.filter(w => w?.type === 'card');
const byID = id => board[id];
const recursively = (routine, result = []) => {
  for (const entry of routine || []) {
    if (typeof entry === 'object' && entry !== null) {
      result.push(entry);
      for (const key of ['thenRoutine', 'elseRoutine', 'loopRoutine']) recursively(entry[key], result);
    }
  }
  return result;
};
const setup = recursively(byID('setupButton').clickRoutine);

test('VTT export is a valid importable ZIP containing top-level 0.json', () => {
  const rawState = JSON.parse(readFileSync(resolve('dist/buraco.json')));
  assert.deepEqual(board, rawState);
});

test('self-contained, parseable VTT game state', () => {
  assert.equal(board._meta.version, 9);
  assert.equal(board._meta.info.name, 'Buraco (manual table)');
  assert.equal(board._meta.info.players, '2,4');
  assert.match(board._meta.info.image, /^\/i\//);
  assert.match(board._meta.info.bgg, /^https:\/\/boardgamegeek.com\/boardgame\//);
  assert.equal(archive.readUInt16LE(12), 33, 'valid DOS date in ZIP local header');
  assert.equal(new Set(Object.keys(board)).size, Object.keys(board).length);
});
test('two distinct 52-card packs, no jokers', () => {
  assert.equal(cards.length, 104);
  assert.equal(cards.filter(c => c.pack === 1).length, 52);
  assert.equal(cards.filter(c => c.pack === 2).length, 52);
  assert.equal(cards.filter(c => c.pack === 2 && c.parent === 'inactivePack').length, 52);
  assert.equal(Object.keys(byID('buracoDeck').cardTypes).length, 52);
  assert(cards.every(c => Boolean(byID('buracoDeck').cardTypes[c.cardType])));
  assert(cards.every(c => c.deck === 'buracoDeck'));
});
test('hands are private with flip on entry and conceal on exit', () => {
  assert.equal(byID('hand').childrenPerOwner, true);
  assert.equal(byID('hand').onEnter.activeFace, 1);
  assert.equal(byID('hand').onLeave.activeFace, 0);
  assert.equal(widgets.filter(w => w?.type === 'seat').length, 4);
  assert.equal(byID('seat3').scale, 1);
  assert.equal(byID('seat4').scale, 1);
});
test('both teams have shared meld lanes, with independent mortos and discard', () => {
  assert.equal(['A', 'B'].flatMap(team => [1,2,3,4].map(n => byID(`meld${team}${n}`))).length, 8);
  assert.equal(byID('discard').onEnter.activeFace, 1);
  assert.equal(byID('mortoA').onEnter.activeFace, 0);
  assert.equal(byID('mortoB').onEnter.activeFace, 0);
  assert.equal(byID('mortoB').display, false, 'one deck starts with second morto hidden');
  assert.equal(byID('mortoBLabel').display, false);
  assert.equal(byID('mortoBButton').display, false);
});
test('setup offers all feasible deck choices', () => {
  const field = byID('setupButton').clickRoutine[0].fields.find(x => x.variable === 'mode');
  assert.deepEqual(field.options.map(x => x.value), ['2p1d', '2p2d', '4p2d']);
  assert(!field.options.some(x => x.value === '4p1d'));
  assert(setup.some(r => r.func === 'RECALL' && r.holder === 'stock'));
  assert(setup.some(r => r.func === 'SHUFFLE' && r.holder === 'stock'));
  assert(setup.some(r => r.func === 'MOVE' && r.to === 'inactivePack' && r.count === 'all'));
  assert(setup.some(r => r.func === 'MOVE' && r.to === 'mortoA' && r.count === 11));
  const conditionalMorto = setup.find(r => r.func === 'IF' && r.operand1 === '${mode}' &&
    r.operand2 === '2p1d' && r.elseRoutine?.some(x => x.func === 'MOVE' && x.to === 'mortoB'));
  assert(conditionalMorto, 'second morto must be dealt only in two-deck modes');
  assert(!recursively(conditionalMorto.thenRoutine).some(x => x.func === 'MOVE' && x.to === 'mortoB'));
  assert(conditionalMorto.elseRoutine.some(x => x.func === 'MOVE' && x.to === 'mortoB' && x.count === 11));
  for (const display of [false, true]) {
    const branch = display ? conditionalMorto.elseRoutine : conditionalMorto.thenRoutine;
    assert(branch.some(x => x.func === 'SET' && x.property === 'display' && x.value === display &&
      ['mortoB', 'mortoBLabel', 'mortoBButton'].every(id => x.collection?.includes(id))));
  }
  assert(setup.some(r => r.func === 'MOVE' && Array.isArray(r.to) && r.to.includes('seat4')));
});
test('players can draw, pick discard, take mortos, and sort', () => {
  for (const id of ['drawButton', 'discardButton', 'mortoAButton', 'mortoBButton', 'sortButton']) {
    assert(byID(id).clickRoutine.length > 0, `Missing button routine ${id}`);
  }
  assert(recursively(byID('mortoAButton').clickRoutine).some(x => x.func === 'MOVE' && x.from === 'mortoA'));
  const oneDeckTake = recursively(byID('mortoAButton').clickRoutine).find(x =>
    x.func === 'IF' && x.operand1 === '${PROPERTY mode OF setupButton}' && x.operand2 === '2p1d');
  assert(oneDeckTake, 'either seated player must be able to take the shared morto in one-deck mode');
  assert(oneDeckTake.thenRoutine.some(x => x.func === 'MOVE' && x.from === 'mortoA' && x.to === '${mySeat}'));
  assert(recursively(byID('mortoBButton').clickRoutine).some(x => x.func === 'MOVE' && x.from === 'mortoB'));
  const sorting = byID('sortButton').clickRoutine;
  assert(sorting.some(x => x.func === 'SELECT' && x.property === 'owner' && x.value === '${playerName}'));
  assert(sorting.some(x => x.func === 'SORT' && x.collection === 'DEFAULT'));
});

test('setup uses one morto with one deck and two with two decks', () => {
  const configurations = [
    { mode: '2p1d', deckCount: 1, players: 2, mortos: 1, stock: 19 },
    { mode: '2p2d', deckCount: 2, players: 2, mortos: 2, stock: 60 },
    { mode: '4p2d', deckCount: 2, players: 4, mortos: 2, stock: 38 }
  ];
  for (const { mode, deckCount, players, mortos, stock } of configurations) {
    assert.equal(deckCount * 52 - players * 11 - mortos * 11, stock, mode);
  }
});
