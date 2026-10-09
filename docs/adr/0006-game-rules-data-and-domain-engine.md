# ADR-0006: Game rules data and domain engine

- **Status:** Proposed
- **Date:** 2026-10-09

## Context

Milestone M3 computes chemistry, squad rating and chemistry-style boosts (PRD §7.1–§7.3). The results must match the game. PRD §6.3 requires the rules to be stored as versioned data, so a mid-season update is a data change.

Two items were still open before M3 (PRD §13):

- the list of FC 27 formations;
- the per-attribute chemistry-style boosts. Guides only publish face-stat boosts, and they disagree with each other.

FUT.GG's public site renders its squad builder and chemistry-style pages from data in its JavaScript bundle (`assets.fut.gg`). On 2026-10-09 the bundle contained:

- the 29 formations with their slots;
- the 24 chemistry styles with every attribute boost at 3 chemistry, and the reduction at 1 and 2 chemistry;
- the attribute weights of each face stat, and the face-stat rounding (`floor(Σ weight × attribute + 0.501)`, capped at 99);
- FUT.GG's chemistry calculation. Its thresholds match PRD §7.1, and it reads the icon and hero contributions from the card's own chemistry fields.

## Decision

**1. A pure TypeScript package, `@fc27/domain`, holds all game logic.**

- It has no I/O, depends on `@fc27/data-sync` for card types only, and runs unchanged in the browser.
- `squadChemistry`: club, league and nation counts of the players in position, icon and hero contributions from the card's chemistry fields, the manager, the thresholds, capped at 3 per player.
- `squadRating`: the PRD §7.2 formula over the starting XI.
- `applyChemistryStyle`: the boosted attributes, capped at 99, and face stats recomputed from them.

**2. The rules are typed data modules in `packages/domain/src/rules`, taken from FUT.GG's bundle.**

| Module                | Contents                                                 |
| --------------------- | -------------------------------------------------------- |
| `formations.ts`       | 29 formations, EA ids, slots with their card positions   |
| `chemistry-styles.ts` | 24 styles, EA ids, attribute boosts at 3 chemistry       |
| `chemistry.ts`        | Thresholds, the per-player cap, partial-chemistry boosts |
| `face-stats.ts`       | Attribute weights of each face stat                      |

- FUT.GG's numbered formation variants get the names its tactics pages use, e.g. "4-3-3 (4)" becomes "4-3-3 Attack".
- Each module names its source and date. A rules change is a pull request that edits these modules, with tests.

**3. Tests cross-check the data against what FUT.GG publishes independently.**

- The slots of every formation equal those on its FUT.GG tactics page.
- The face-stat gains computed from each style's attribute boosts and the face weights equal the gains on FUT.GG's chemistry-styles page, for all 24 styles.
- The face-stat formula reproduces the printed face stats of real cards.

**4. AcceleRATE is not recomputed after a style boost.** FUT.GG's bundle only distinguishes three of the seven FC 27 types, so the card keeps its source AcceleRATE. This is revisited with the true rating (M3, part 2).

## Alternatives considered

- **Community guides:** they give face-stat boosts only and contradict each other, e.g. Sniper as Shooting and Physical, or Shooting and Dribbling.
- **Reading the boosts in the game:** 24 styles × up to 16 attributes by hand is error-prone, and the owner does not always have access to the game.
- **Rules as JSON files:** typed modules catch a misspelt attribute at compile time and need no runtime validation.

## Consequences

- The domain engine is fully unit- and mutation-tested and has no network dependency.
- If FUT.GG's data is wrong, ours is too. The cross-checks only prove consistency between FUT.GG's bundle and its pages. Mismatches the owner sees in the game are fixed in the rules modules.
- The squad-rating formula is still the community one. Its rounding is pinned by tests, but it has not yet been compared with in-game squads.
