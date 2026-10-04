export function buildTable() {
const board = {
  _meta: {
    version: 9,
    info: {
      name: 'Buraco (manual table)',
      description: 'Flexible Buraco table for 2 or 4 players. Choose one or two 52-card decks when you start a hand. Private hands, one morto with one deck or two mortos with two decks, open melds and discard pile. Players enforce rules manually.',
      mode: 'vs',
      image: '/i/cards-default/2B.svg',
      bgg: 'https://boardgamegeek.com/boardgame/64431/buraco',
      rules: 'https://www.pagat.com/rummy/buraco.html',
      players: '2,4',
      time: '45',
      language: 'pt-BR',
      showName: true,
      attribution: 'Game configuration by objectivebot/vtt-buraco. Default card artwork shipped with VirtualTabletop.io.',
      helpText: 'All players take their seats first. Select <b>New hand / options</b> and choose a setup. Players use their own browser or phone to see private cards. Buraco rules and scoring are handled by the players.'
    }
  }
};
let z = 1;
function add(id, props) {
  if (board[id]) throw new Error(`Duplicate widget ID ${id}`);
  board[id] = { type: props.type, id, z: z++, ...props };
}
const felt = 'background: #174832; border: 2px solid #a6be99; border-radius: 12px; color: #f9fcf5;';
const pale = 'background: #e6ecdd; border: 1px solid #8bb49e; border-radius: 10px; font-size: 19px; color: #173b2b;';
const labelCss = 'background: transparent; border: 0; color: #f1f6ed; font-size: 24px; text-align: center;';
function label(id, text, x, y, width = 250, extra = {}) {
  add(id, { type: 'label', text, x, y, width, height: 38, movable: false, css: labelCss, ...extra });
}
function holder(id, x, y, width = 115, height = 174, extra = {}) {
  add(id, { type: 'holder', x, y, width, height, movableInEdit: false, dropTarget: { type: 'card' }, css: felt, ...extra });
}
function button(id, text, x, y, width, clickRoutine, extra = {}) {
  add(id, { type: 'button', x, y, width, height: 49, text, css: pale, movableInEdit: false, clickRoutine, ...extra });
}

// Seats remain visible in both modes so four players can sit *before* starting a new hand.
// Seat 1 / 3 = team A in four-player mode; seats 1 / 2 only in two-player mode.
label('header', 'BURACO  •  MESA LIVRE', 465, 12, 640, { css: 'border:0;background:transparent;color:#f3f1db;font-size:35px;font-weight:bold;text-align:center;' });
label('modeLabel', '2 jogadores • 1 baralho • 1 morto', 1015, 25, 360, { css: 'background:transparent;border:0;color:#ebdc9d;font-size:20px;text-align:center;' });
label('seatNotice', 'Ocupem os assentos antes de distribuir as cartas', 360, 65, 860, { css: 'background:transparent;border:0;color:#d7e8d6;font-size:18px;text-align:center;' });

const seatJoinRoutine = [
  'var guestPrefix = substr ${playerName} 0 5',
  { func: 'IF', operand1: '${guestPrefix}', operand2: 'Guest', thenRoutine: [
    { func: 'INPUT', header: 'Como você quer ser chamado?', fields: [
      { type: 'string', label: 'Nome', variable: 'playerName', value: '${playerName}' },
      { type: 'color', label: 'Cor', variable: 'playerColor', value: '${playerColor}' }
    ] }
  ] },
  { func: 'CLICK', collection: 'thisButton', mode: 'ignoreClickRoutine' }
];
const seats = [
  ['seat1', 1, 205, 730, 1],
  ['seat2', 2, 1125, 730, 1],
  ['seat3', 3, 205, 105, 1],
  ['seat4', 4, 1125, 105, 1]
];
for (const [id, index, x, y, scale] of seats) {
  add(id, { type: 'seat', index, x, y, scale, movableInEdit: false, clickRoutine: seatJoinRoutine });
}

// VTT's childrenPerOwner provides a shared widget with individually private hands.
holder('hand', 160, 808, 1110, 177, {
  childrenPerOwner: true, inheritChildZ: true, onEnter: { activeFace: 1 }, onLeave: { activeFace: 0 },
  dropOffsetX: 8, dropOffsetY: 8, stackOffsetX: 61,
  css: 'background:#255d44;border:3px solid #c5d6bc;border-radius:15px;color:white;'
});
label('handLabel', 'SUA MÃO (PRIVADA)', 560, 765, 370, { css: 'background:transparent;border:0;color:#f7efcf;font-size:21px;text-align:center;' });
label('teamALabel', 'TIME A  —  J1 + J3', 595, 125, 400);
label('teamBLabel', 'TIME B  —  J2 + J4', 595, 423, 400);
for (const [team, y] of [['A', 164], ['B', 462]]) {
  for (let i = 1; i <= 4; i++) {
    const x = 190 + (i - 1) * 299;
    holder(`meld${team}${i}`, x, y, 270, 181, {
      stackOffsetX: 22, dropOffsetX: 8, onEnter: { activeFace: 1 },
      css: 'background: #20523b; border: 1px dashed #bdd0bc; border-radius: 12px;'
    });
  }
}

// One logical VTT deck with two independent copies: RECALL returns all cards,
// then 1-deck mode parks copy #2 off-table until the next setup.
holder('stock', 17, 643, 119, 170, { onEnter: { activeFace: 0 }, css: felt });
holder('inactivePack', -1600, -1600, 119, 170, { css: 'background:transparent;border:0;' });
holder('mortoA', 17, 217, 119, 170, { onEnter: { activeFace: 0 }, css: felt });
holder('mortoB', 17, 411, 119, 170, { onEnter: { activeFace: 0 }, css: felt, display: false });
holder('discard', 1411, 471, 119, 170, {
  onEnter: { activeFace: 1 }, stackOffsetY: 0, css: felt
});
label('stockLabel', 'COMPRA', 12, 603, 128, { css: 'background:transparent;border:0;color:white;font-size:20px;text-align:center;' });
label('mortoALabel', 'MORTO', 13, 181, 128, { css: 'background:transparent;border:0;color:white;font-size:20px;text-align:center;' });
label('mortoBLabel', 'MORTO B', 13, 376, 128, { css: 'background:transparent;border:0;color:white;font-size:20px;text-align:center;', display: false });
label('discardLabel', 'LIXO', 1411, 432, 119, { css: 'background:transparent;border:0;color:white;font-size:22px;text-align:center;' });

const suits = [ ['clubs','C','♣'], ['diamonds','D','♦'], ['hearts','H','♥'], ['spades','S','♠'] ];
const ranks = [ ['A','A'], ['2','2'], ['3','3'], ['4','4'], ['5','5'], ['6','6'], ['7','7'], ['8','8'], ['9','9'], ['10','T'], ['J','J'], ['Q','Q'], ['K','K'] ];
const cardTypes = {};
for (const [suit, code, glyph] of suits) {
  for (const [rank, imageRank] of ranks) {
    cardTypes[`${suit}-${rank}`] = {
      label: `${rank} ${glyph}`, image: `/i/cards-default/${imageRank}${code}.svg`,
      suit: code, rank: String(ranks.findIndex(v => v[0] === rank) + 1).padStart(2, '0')
    };
  }
}
add('buracoDeck', {
  type: 'deck', parent: 'stock', x: 7, y: 7,
  cardTypes,
  cardDefaults: { card: 'regular' },
  faceTemplates: [
    { border: false, radius: false, objects: [{ type: 'image', x: 0, y: 0, width: 103, height: 160, value: '/i/cards-default/2B.svg', color: 'transparent' }] },
    { border: false, radius: false, objects: [{ type: 'image', x: 0, y: 0, width: 103, height: 160, dynamicProperties: { value: 'image' }, color: 'transparent' }] }
  ]
});
for (let pack = 1; pack <= 2; pack++) {
  for (const kind of Object.keys(cardTypes)) {
    const id = `card-${pack}-${kind}`;
    // Explicit 1-based pack marking makes 1/2 deck selection deterministic.
    add(id, { type: 'card', deck: 'buracoDeck', cardType: kind, pack,
      parent: pack === 1 ? 'stock' : 'inactivePack', activeFace: 0
    });
  }
}

// Selection/moving to the current player's seat uses the supported VTT seat->hand routing.
const findCurrentSeat = [
  { func: 'SELECT', type: 'seat', property: 'player', value: '${playerName}' },
  { func: 'COUNT', variable: 'occupiedByMe' },
  { func: 'GET', property: 'id', variable: 'mySeat' }
];
const onlyIfSeated = thenRoutine => [
  ...findCurrentSeat,
  { func: 'IF', operand1: '${occupiedByMe}', operand2: 1, thenRoutine }
];
button('drawButton', 'Comprar 1 carta', 1375, 138, 197,
  onlyIfSeated([{ func: 'MOVE', from: 'stock', to: '${mySeat}', count: 1, face: 1 }]));
button('discardButton', 'Pegar todo o lixo', 1375, 200, 197,
  onlyIfSeated([{ func: 'MOVE', from: 'discard', to: '${mySeat}', count: 'all', face: 1 }]));
// In one-deck play either seated player can take the single shared morto.
// With two decks each team can take only its own morto.
button('mortoAButton', 'Pegar morto', 1375, 267, 197,
  onlyIfSeated([{ func: 'IF', operand1: '${PROPERTY mode OF setupButton}', operand2: '2p1d',
    thenRoutine: [{ func: 'MOVE', from: 'mortoA', to: '${mySeat}', count: 'all', face: 1 }],
    elseRoutine: [
      { func: 'IF', operand1: '${mySeat}', operand2: 'seat1', thenRoutine: [{ func: 'MOVE', from: 'mortoA', to: '${mySeat}', count: 'all', face: 1 }], elseRoutine: [
        { func: 'IF', operand1: '${mySeat}', operand2: 'seat3', thenRoutine: [{ func: 'MOVE', from: 'mortoA', to: '${mySeat}', count: 'all', face: 1 }] }
      ] }
    ]
  }]));
button('mortoBButton', 'Pegar morto B', 1375, 326, 197,
  onlyIfSeated([{ func: 'IF', operand1: '${mySeat}', operand2: 'seat2', thenRoutine: [{ func: 'MOVE', from: 'mortoB', to: '${mySeat}', count: 'all', face: 1 }], elseRoutine: [
    { func: 'IF', operand1: '${mySeat}', operand2: 'seat4', thenRoutine: [{ func: 'MOVE', from: 'mortoB', to: '${mySeat}', count: 'all', face: 1 }] }
  ] }]), { display: false });
button('sortButton', 'Ordenar minha mão', 1300, 827, 265, [
  { func: 'SELECT', property: 'parent', value: 'hand' },
  { func: 'SELECT', source: 'DEFAULT', property: 'owner', value: '${playerName}' },
  { func: 'SORT', collection: 'DEFAULT', key: 'cardType' }
]);

const gameModes = [
  { value: '2p1d', text: '2 jogadores — 1 baralho', selected: true },
  { value: '2p2d', text: '2 jogadores — 2 baralhos' },
  { value: '4p2d', text: '4 jogadores — 2 baralhos' }
];
// The deck count is not hardwired to player count; every *feasible* pairing is offered.
// 4 players + 1 deck cannot supply 44 hand cards plus even one 11-card morto.
const setupRoutine = [
  { func: 'INPUT', header: 'Nova rodada / opções', fields: [
    { type: 'title', text: 'Atenção: as cartas atuais serão recolhidas!' },
    { type: 'text', text: 'Todos devem ocupar seus assentos antes de começar.' },
    { type: 'select', label: 'Jogadores e quantidade de baralhos', variable: 'mode', value: '${PROPERTY mode}', options: gameModes }
  ], confirmButtonText: 'Distribuir', cancelButtonText: 'Cancelar' },
  { func: 'SET', collection: 'thisButton', property: 'mode', value: '${mode}' },
  // RECALL catches both physical copies, including cards currently in hands/melds.
  { func: 'RECALL', holder: 'stock' },
  { func: 'SELECT', type: 'card', property: 'deck', value: 'buracoDeck' },
  { func: 'SET', property: 'owner', value: null },
  { func: 'FLIP', holder: 'stock', face: 0 },
  { func: 'IF', operand1: '${mode}', operand2: '2p1d', thenRoutine: [
    { func: 'SELECT', type: 'card', property: 'pack', value: 2 },
    { func: 'MOVE', collection: 'DEFAULT', to: 'inactivePack', count: 'all', face: 0 },
    { func: 'LABEL', label: 'modeLabel', mode: 'set', value: '2 jogadores • 1 baralho • 1 morto' }
  ], elseRoutine: [
    { func: 'IF', operand1: '${mode}', operand2: '2p2d', thenRoutine: [
        { func: 'LABEL', label: 'modeLabel', mode: 'set', value: '2 jogadores • 2 baralhos (J1 + J2)' }
    ], elseRoutine: [
      { func: 'LABEL', label: 'modeLabel', mode: 'set', value: '4 jogadores • 2 baralhos' }
    ] }
  ] },
  { func: 'SHUFFLE', holder: 'stock' },
  { func: 'MOVE', from: 'stock', to: 'mortoA', count: 11, face: 0 },
  // Two-deck modes use a second morto. With one deck it is neither dealt nor shown.
  { func: 'IF', operand1: '${mode}', operand2: '2p1d',
    thenRoutine: [
      { func: 'SET', collection: ['mortoB', 'mortoBLabel', 'mortoBButton'], property: 'display', value: false },
      { func: 'SET', collection: ['mortoAButton'], property: 'text', value: 'Pegar morto' },
      { func: 'LABEL', label: 'mortoALabel', mode: 'set', value: 'MORTO' }
    ],
    elseRoutine: [
      { func: 'MOVE', from: 'stock', to: 'mortoB', count: 11, face: 0 },
      { func: 'SET', collection: ['mortoB', 'mortoBLabel', 'mortoBButton'], property: 'display', value: true },
      { func: 'SET', collection: ['mortoAButton'], property: 'text', value: 'Pegar morto A' },
      { func: 'LABEL', label: 'mortoALabel', mode: 'set', value: 'MORTO A' }
    ]
  },
  { func: 'MOVE', from: 'stock', to: ['seat1', 'seat2'], count: 11, face: 1 },
  { func: 'IF', operand1: '${mode}', operand2: '4p2d', thenRoutine: [
    { func: 'MOVE', from: 'stock', to: ['seat3', 'seat4'], count: 11, face: 1 }
  ] }
];
button('setupButton', 'Nova mão / opções', 1374, 25, 200, setupRoutine, { mode: '2p1d', css: 'background:#f1d99b;border:2px solid #8a6622;color:#332b17;font-size:18px;border-radius:10px;' });
  return board;
}
