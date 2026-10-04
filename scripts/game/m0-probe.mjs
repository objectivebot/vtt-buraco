// Isolated native VirtualTabletop experiment. Do not embed it in the Buraco
// game until the two-browser smoke test in docs/M0.md has been completed.
// The destination holder's enterRoutine reverts an unapproved local drop;
// it does NOT prevent a forged remote delta from reaching the server.
export function buildM0Probe() {
  const board = {
    _meta: { version: 9, info: {
      name: 'Buraco M0 — event and rollback probe',
      description: 'Development-only two-browser test of native client-side drop validation.',
      mode: 'tutorial', image: '/i/cards-default/2B.svg',
      bgg: 'https://boardgamegeek.com/boardgame/64431/buraco',
      players: '2', language: 'pt-BR', time: '5',
      attribution: 'objectivebot/vtt-buraco', showName: true
    }}
  };
  let z = 1;
  const add = (id, type, properties) => {
    if(board[id]) throw Error('Duplicate probe widget ' + id);
    board[id] = { id, type, z: z++, ...properties };
  };
  const textCSS = 'background:transparent;color:white;border:0;text-align:center;font-size:20px;';
  add('probeTitle', 'label', { x: 320, y: 35, width: 800, height: 60,
    text: 'M0: reversão de movimentos (CLIENTE)', css: textCSS });
  add('probeInstructions', 'label', { x: 180, y: 103, width: 1080, height: 72,
    text: 'Alice ocupa o assento 1; Bob ocupa o 2. Arraste o Ás para DESTINO. Sem autorização ele deve voltar.',
    css: textCSS });
  add('probeSeat1', 'seat', { x: 210, y: 560, index: 1 });
  add('probeSeat2', 'seat', { x: 1040, y: 560, index: 2 });
  add('probeGate', 'label', { x: -1200, y: -1200, text: 'internal',
    gate: 'closed', gateOwner: '' });
  add('probeStatus', 'label', { x: 260, y: 220, width: 950, height: 55,
    text: 'Destino fechado: arrastar deve ser rejeitado', css: textCSS });
  const origin = 'probeOrigin';
  const destination = 'probeTarget';
  add(origin, 'holder', { x: 270, y: 342, width: 120, height: 180,
    text: 'ORIGEM', dropTarget: { type: 'card' }, onEnter: { activeFace: 1 } });
  const returnCard = [
    { func: 'SET', collection: 'child', property: 'parent', value: origin },
    { func: 'LABEL', label: 'probeStatus', mode: 'set', value: 'Rejeitado pelo cliente: carta devolvida à origem' }
  ];
  add(destination, 'holder', { x: 840, y: 342, width: 120, height: 180,
    text: 'DESTINO', dropTarget: { type: 'card' }, onEnter: { activeFace: 1 },
    enterRoutine: [
      { func: 'IF', operand1: '${PROPERTY gate OF probeGate}', operand2: 'open',
        thenRoutine: [
          { func: 'IF', operand1: '${PROPERTY gateOwner OF probeGate}', operand2: '${playerName}',
            thenRoutine: [
              { func: 'SET', collection: ['probeGate'], property: 'gate', value: 'closed' },
              { func: 'SET', collection: ['probeGate'], property: 'gateOwner', value: '' },
              { func: 'LABEL', label: 'probeStatus', mode: 'set', value: 'Aceito pelo cliente: Alice autorizou o movimento' }
            ], elseRoutine: returnCard
          }
        ], elseRoutine: returnCard
      }
    ]
  });
  add('probeDeck', 'deck', { x: -500, y: -500,
    cardTypes: { 'clubs-A': { label: 'A ♣', image: '/i/cards-default/AC.svg' } },
    faceTemplates: [
      { objects: [{ type: 'image', x: 0, y: 0, width: 103, height: 160, value: '/i/cards-default/2B.svg' }] },
      { objects: [{ type: 'image', x: 0, y: 0, width: 103, height: 160,
        dynamicProperties: { value: 'image' } }] }
    ]
  });
  add('probeCard', 'card', { x: 5, y: 5, parent: origin, deck: 'probeDeck',
    cardType: 'clubs-A', activeFace: 1, movable: true });
  add('probeApprove', 'button', { x: 540, y: 370, width: 245, height: 65,
    text: 'Alice: autorizar 1 jogada',
    clickRoutine: [
      { func: 'SELECT', type: 'seat', property: 'id', value: 'probeSeat1' },
      { func: 'SELECT', source: 'DEFAULT', property: 'player', value: '${playerName}' },
      { func: 'COUNT', variable: 'isAlice' },
      { func: 'IF', operand1: '${isAlice}', operand2: 1, thenRoutine: [
        { func: 'SET', collection: ['probeGate'], property: 'gate', value: 'open' },
        { func: 'SET', collection: ['probeGate'], property: 'gateOwner', value: '${playerName}' },
        { func: 'LABEL', label: 'probeStatus', mode: 'set', value: 'Autorizado: Alice pode mover uma carta' }
      ], elseRoutine: [
        { func: 'LABEL', label: 'probeStatus', mode: 'set', value: 'Rejeitado: só Alice (assento 1) pode autorizar' }
      ]}
    ]
  });
  add('probeReset', 'button', { x: 540, y: 450, width: 245, height: 55, text: 'Reiniciar teste',
    clickRoutine: [
      { func: 'SET', collection: ['probeGate'], property: 'gate', value: 'closed' },
      { func: 'SET', collection: ['probeGate'], property: 'gateOwner', value: '' },
      { func: 'MOVE', from: [ 'probeCard' ], to: origin, count: 1, face: 1 },
      { func: 'LABEL', label: 'probeStatus', mode: 'set', value: 'Teste reiniciado' }
    ]
  });
  return board;
}
