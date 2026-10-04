import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProbeState, applyProbeAction, serializeProbeState, restoreProbeState } from '../src/core/prototype.mjs';
import { buildM0Probe } from '../scripts/game/m0-probe.mjs';
import { inflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const valid = (state, from, to, revision=state.revision, actor='Alice') =>
  applyProbeAction(state, { type:'move',card:'proof',actor,from,to,expectedRevision:revision });

test('reference reducer accepts a valid command, records one event and does not mutate original', () => {
  const before=initialProbeState(), after=valid(before,'origin','target');
  assert(after.accepted);
  assert.equal(before.cards.proof, 'origin');
  assert.equal(before.revision, 0);
  assert.equal(after.state.cards.proof, 'target');
  assert.equal(after.state.revision, 1);
  assert.equal(after.state.events.length, 1);
});
test('a rejected action preserves exactly the same state object and revision', () => {
  const before=initialProbeState();
  for(const action of [
    { type:'move',card:'proof',actor:'Bob',from:'origin',to:'target',expectedRevision:0 },
    { type:'move',card:'wrong',actor:'Alice',from:'origin',to:'target',expectedRevision:0 },
    { type:'move',card:'proof',actor:'Alice',from:'target',to:'origin',expectedRevision:0 },
    { type:'move',card:'proof',actor:'Alice',from:'origin',to:'other',expectedRevision:0 },
    { type:'move',card:'proof',actor:'Alice',from:'origin',to:'target' }
  ]) {
    const r=applyProbeAction(before,action);
    assert.equal(r.accepted,false);
    assert.strictEqual(r.state,before);
  }
});
test('two clients racing on revision zero cannot both commit in reference reducer', () => {
  const before=initialProbeState(), alice=valid(before,'origin','target');
  const stale=valid(alice.state,'origin','target',0);
  assert.equal(alice.accepted,true);
  assert.equal(stale.accepted,false);
  assert.equal(stale.reason,'stale_revision');
  assert.strictEqual(stale.state,alice.state);
  assert.equal(alice.state.events.length,1);
});
test('save and restore validate event history and preserve ability to continue', () => {
  const moved=valid(initialProbeState(),'origin','target').state;
  const restored=restoreProbeState(serializeProbeState(moved));
  assert.deepEqual(restored,moved);
  assert.equal(valid(restored,'target','origin').state.revision,2);
  assert.throws(()=>restoreProbeState(JSON.stringify({...moved,cards:{proof:'origin'}})),/diverges/);
});
test('M0 VTT probe exports a destination enterRoutine that returns rejected cards', () => {
  const state=buildM0Probe(), routine=state.probeTarget.enterRoutine;
  const serialized=JSON.stringify(routine);
  assert.match(serialized,/gateOwner/);
  assert.match(serialized,/oldParentID|probeOrigin/);
  assert.match(serialized,/"collection":"child","property":"parent","value":"probeOrigin"/);
  assert.equal(state.probeGate.gate,'closed');
  assert.equal(state.probeCard.parent,'probeOrigin');
  assert.equal(state.probeCard.movable,true);
});
test('probe ZIP contains exact corresponding JSON state', () => {
  const zip=readFileSync('dist/m0-probe.vtt');
  const filenameSize=zip.readUInt16LE(26);
  assert.equal(zip.toString('utf8',30,30+filenameSize),'0.json');
  const offset=30+filenameSize+zip.readUInt16LE(28);
  const payload=inflateRawSync(zip.subarray(offset,offset+zip.readUInt32LE(18)));
  assert.deepEqual(JSON.parse(payload),JSON.parse(readFileSync('dist/m0-probe.json','utf8')));
});
