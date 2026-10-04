// M0 reference reducer. Not bundled into a .vtt: VTT executes its own routine
// language. This is the executable contract we will translate for M1+.
const locations = new Set(['origin', 'target']);
export function initialProbeState() {
  return { schema: 1, revision: 0, allowedPlayer: 'Alice',
    cards: { proof: 'origin' }, events: [] };
}
export function validateProbeState(state) {
  if(state?.schema !== 1 || !Number.isSafeInteger(state.revision) || state.revision < 0 ||
     state.allowedPlayer !== 'Alice' ||
     !state.cards || Object.keys(state.cards).length !== 1 ||
     !locations.has(state.cards.proof) || !Array.isArray(state.events) ||
     state.events.length !== state.revision)
    throw new Error('Invalid M0 proof state');
  return state;
}
// Compare-and-swap: the caller must supply the revision and the exact source.
// Failures MUST NOT mutate the input or advance the revision.
export function applyProbeAction(state, action) {
  validateProbeState(state);
  const reject = reason => ({ accepted: false, reason, state });
  if(!action || !Number.isSafeInteger(action.expectedRevision))
    return reject('missing_revision');
  if(action.expectedRevision !== state.revision)
    return reject('stale_revision');
  if(action.actor !== state.allowedPlayer)
    return reject('unauthorized_actor');
  if(action.type !== 'move' || action.card !== 'proof' ||
     !locations.has(action.from) || !locations.has(action.to) ||
     action.from === action.to)
    return reject('invalid_action');
  if(state.cards.proof !== action.from)
    return reject('incorrect_source');
  const event = { revision: state.revision + 1, actor: action.actor,
    card: action.card, from: action.from, to: action.to };
  return { accepted: true, event, state: {
    ...state, revision: event.revision,
    cards: { ...state.cards, proof: action.to },
    events: [...state.events, event]
  }};
}
export function serializeProbeState(state) {
  validateProbeState(state);
  return JSON.stringify(state);
}
export function restoreProbeState(json) {
  const state = validateProbeState(JSON.parse(json));
  // Check that the event history actually produces the saved card location.
  let location = 'origin';
  for(const [i, event] of state.events.entries()) {
    if(event.revision !== i+1 || event.actor !== state.allowedPlayer ||
       event.card !== 'proof' || event.from !== location ||
       !locations.has(event.to) || event.to === location)
      throw new Error('Invalid M0 proof event history');
    location = event.to;
  }
  if(location !== state.cards.proof) throw new Error('Snapshot diverges from events');
  return state;
}
