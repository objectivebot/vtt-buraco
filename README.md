# vtt-buraco

A configurable **Buraco/Burraco** virtual table for [VirtualTabletop.io](https://virtualtabletop.io/) (VTT). Unlike a rules engine, this first version is a **manual card table**: players choose how to meld, what counts as a clean/dirty canasta, when to go out, and how to score.

## Options

Choose **New hand / options** at the beginning of a game, after everybody occupies a seat:

| Players | Decks | Starting hands | Mortos | Stock left |
| --- | --- | --- | --- | --- |
| 2 | 1 × 52 | 11 per player | 2 × 11 | 8 |
| 2 | 2 × 52 | 11 per player | 2 × 11 | 60 |
| 4 | 2 × 52 | 11 per player | 2 × 11 | 38 |

Four players with one deck is deliberately unavailable: 44 starting cards plus 22 morto cards need **66** cards. No jokers are included by default; the 2s can act as wildcards according to the agreed rules.

## Play on phones / browsers

1. Start a [new VTT room](https://virtualtabletop.io/) on the server you prefer.
2. In its **Game Shelf**, use **Add Game → Upload** and select the ZIP-based [`dist/buraco.vtt`](dist/buraco.vtt) export; alternatively drag the file into the Game Shelf. See [VTT's game import guide](https://github.com/ArnoldSmith86/virtualtabletop/wiki/Playing-Games).
3. Share the room URL. Each player should connect using their own browser (including mobile) and choose their assigned seat.
4. Use **Nova mão / opções** to pick the player/deck setup and deal. Starting a new hand collects *all* cards, including cards already in players' hands or melds.
5. Use **Comprar 1 carta** or **Pegar todo o lixo**, drag cards from your private hand to the team meld zones or discard pile, and use **Pegar morto A/B** at the appropriate time.

**Seat/team mapping:** for two players, **use only seats 1 and 2** (the other seats stay visible so you can switch modes without trapping new players). Seat 1 is team A and seat 2 is team B. For four, seats 1 and 3 form team A and seats 2 and 4 form team B. The two mortos are shared by team, and the button only routes a morto to a player on the matching team. A real Buraco game's morto timing, discard restrictions, and scoring are not validated automatically.

The hand widget uses VTT's `childrenPerOwner` feature; its contents are individually private for each player. Like VTT generally, **this is not an anti-cheat or access-control system**. All users who can access a room may be able to edit/reconfigure it, so play with people you trust.

## What's included

- Two standard 52-card packs (the second stored off-board unless enabled).
- VTT-native face artwork; no external image assets or custom server are required.
- Private hand for each seated player, with automatic card facing and a sort action.
- Automatic shuffle/deal on setup; 11 cards per player and two 11-card mortos.
- Shared meld lanes for both teams, stock and face-up discard.
- Buttons to draw, pick up the entire discard pile and take your team's morto.
- Node.js standard-library-only generator and static tests; a GitHub Actions workflow validates generated files.

## Upload troubleshooting

If the upload tile briefly appears and disappears, first click **Reset filters** or set
Players, Language and Mode to **Any** and clear the search field. VirtualTabletop
intentionally shows the temporary upload tile regardless of filters, while the
permanent game tile obeys those filters. This game advertises exactly 2 or 4 players
and Portuguese (`pt-BR`).

If no game appears even with filters cleared, check the browser Network tab for the
`addState/.../file/...` request and inspect its HTTP status and response. VTT's upload
UI also removes the temporary tile after a failed request.

The GitHub workflow checks ZIP integrity, runs VTT's **official game-file validator**,
and passes the generated archive through VTT's **real server importer** before
publishing the download.

## Limitations of this MVP

- Manual turn-taking, card melding, scoring and win conditions. The morto button is **not** proof a player is eligible to take it.
- The 1-deck, 2-player option leaves only **8 cards** in stock after setup. That is intentional per the requested option, but can make the game extremely short. The 2-deck mode may be preferable for regular play.
- The layout is a shared VTT table, not a separate optimized mobile app. VTT can be used in a mobile browser with pinch zoom/pan.
- This release is statically validated, **not yet smoke-tested in a live VTT room**. If a server version changes routine behavior, inspect the room in Edit mode and report the issue.

## Development

Requires Node.js 18+; no `npm install` needed.

```bash
npm run check  # rebuild JSON and run tests
npm run build  # update dist/buraco.vtt (ZIP) and dist/buraco.json (editable state)
```

The VTT state is generated from `scripts/build.mjs` for reviewable changes. `dist/buraco.vtt` is a ZIP archive with a top-level `0.json` file, as required by VirtualTabletop's importer; `dist/buraco.json` is the corresponding readable state for debugging. Do not edit either generated file directly; update the source and rebuild it.

## Potential follow-ups

- Score panel with configurable clean/dirty canasta rules.
- Enforce turns / draw vs pickup / morto eligibility.
- Mobile-specific spectator-table and hand-only layouts.
- Configurable jokers and house rules.

## References

- [VirtualTabletop source](https://github.com/ArnoldSmith86/virtualtabletop)
- [VTT widget functions](https://github.com/ArnoldSmith86/virtualtabletop/wiki/Functions)
- [VTT import instructions](https://github.com/ArnoldSmith86/virtualtabletop/wiki/Playing-Games)