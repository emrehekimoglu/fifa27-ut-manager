# True rating

- **Status:** Approved (#19)
- **Date:** 2026-10-09
- **Requirement:** PRD §7.4 (true rating) and §7.3 (chemistry-style auto-selection)

The card's overall rating is EA's position formula. It ignores most of what makes a card good in the game: weak foot, skill moves, AcceleRATE, height and PlayStyles. The true rating is our own score that includes them. It drives the playground, the squad builder and, from M6, the recommendations.

## 1. What it computes

```
trueRating(card, position, chemistryStyle, chemistry) → 0.0–99.0
```

- **One score per card per position,** for the 12 card positions. Roles are not modelled separately; role-based ratings are a v0.2 item (PRD §2.2).
- **Mirrored positions share their weights,** so there are nine position groups:

  | Group | Positions | Group | Positions |
  | ----- | --------- | ----- | --------- |
  | GK    | GK        | CM    | CM        |
  | CB    | CB        | CAM   | CAM       |
  | FB    | RB, LB    | WM    | RM, LM    |
  | CDM   | CDM       | W     | RW, LW    |
  | ST    | ST        |       |           |

- **The result has one decimal.** The UI shows it as "Gerçek reyting 87,4". The extra precision separates cards that the overall rating ties.
- **It is a pure function** in `@fc27/domain`, like chemistry and squad rating. It has no I/O.

## 2. Formula

```
trueRating = clamp(0, 99, A + B_wf + B_sm + B_acc + B_height + B_ps + B_role)
```

All weights below are per position group and live in a versioned rules module, `packages/domain/src/rules/true-rating.ts` (ADR-0006). Changing a weight is a data change with tests, not a code change.

### 2.1 Attributes (A)

```
A = Σ w[a] × attribute[a]      with every w[a] ≥ 0 and Σ w[a] = 1
```

- The attributes are those **after the chemistry-style boost** at the player's chemistry (`applyChemistryStyle`, capped at 99).
- Because the weights sum to 1, `A` is on the attribute scale: a card with 85 in every relevant attribute gets `A = 85`.
- Outfield groups can weight all 29 outfield attributes. The GK group weights the five goalkeeper attributes plus reactions, acceleration, sprint speed, jumping and strength.

### 2.2 Weak foot (B_wf) and skill moves (B_sm)

```
B_wf = c_wf × (weakFoot − 3)
B_sm = c_sm × (skillMoves − 3)
```

- Three stars is the neutral point. A 5-star weak foot at a group with `c_wf = 0.8` adds 1.6; a 2-star one subtracts 0.8.
- The coefficients are ≥ 0. Skill moves have `c_sm = 0` for GK.

### 2.3 AcceleRATE (B_acc)

```
B_acc = c_acc × k(type)
```

| Type                 | k    | Type               | k    |
| -------------------- | ---- | ------------------ | ---- |
| Explosive            | +1   | Controlled lengthy | −1/3 |
| Mostly explosive     | +2/3 | Mostly lengthy     | −2/3 |
| Controlled explosive | +1/3 | Lengthy            | −1   |
| Controlled           | 0    |                    |      |

- **Which type applies.** FUT.GG's card data already lists, for each card, the AcceleRATE type it gets with each outfield chemistry style (`accelerateTypes`; for example, base Pelé is Explosive with 17 styles and Controlled with Architect and Sniper). This removes the need for the seven AcceleRATE rules:
  - at 3 chemistry, the type for the chosen style;
  - at 0 chemistry, the card's base type;
  - at 1 or 2 chemistry, the base type. This is an approximation: the partial boost may or may not cross the threshold, and FUT.GG only publishes the full-boost type.
  - for goalkeepers and EA-sourced cards, the base type.
- `c_acc` may be negative in a group where a lengthy run is worth more than a quick start.

### 2.4 Height (B_height)

```
B_height = c_h × clamp(−3, 3, (heightCm − 180) / 5)
```

- Each 5 cm from 180 cm counts as one step, up to three steps (165–195 cm).
- `c_h` may be negative, e.g. if short wingers turn out to be worth more.
- Body type is not used. FUT.GG has a `bodytypeCode`, but its values are not documented and the catalog does not store it.

### 2.5 PlayStyles (B_ps)

```
B_ps = min(cap, α × Σ relevance[ps] × (ps is PlayStyle+ ? β : 1))
```

- **Relevance** is a fixed table (below): 2 for a core PlayStyle at the position, 1 for a useful one, 0 for none. Fitting 36 PlayStyles × 9 groups separately would need far more data than we have, and a table the owner can read and correct is worth more than a few tenths of accuracy.
- **α** (per group) and **β** (one global multiplier for PlayStyle+, starting at 2) are fitted (§4). **cap** limits the total, starting at 6 points.

| PlayStyle (EA id)     | GK  | CB  | FB  | CDM | CM  | CAM | WM  | W   | ST  |
| --------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Finesse Shot (0)      | 0   | 0   | 0   | 0   | 1   | 2   | 1   | 2   | 2   |
| Chip Shot (1)         | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 1   | 1   |
| Power Shot (2)        | 0   | 0   | 0   | 0   | 1   | 1   | 1   | 1   | 2   |
| Dead Ball (3)         | 0   | 0   | 1   | 0   | 1   | 1   | 1   | 1   | 1   |
| Incisive Pass (5)     | 0   | 0   | 0   | 1   | 2   | 2   | 1   | 1   | 1   |
| Pinged Pass (6)       | 0   | 1   | 1   | 2   | 2   | 1   | 1   | 1   | 0   |
| Long Ball Pass (7)    | 0   | 1   | 1   | 2   | 2   | 1   | 1   | 0   | 0   |
| Tiki Taka (8)         | 0   | 1   | 1   | 2   | 2   | 2   | 1   | 1   | 1   |
| Whipped Pass (9)      | 0   | 0   | 2   | 0   | 1   | 0   | 2   | 1   | 0   |
| Jockey (10)           | 0   | 2   | 2   | 2   | 1   | 0   | 0   | 0   | 0   |
| Block (11)            | 0   | 2   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Intercept (12)        | 0   | 2   | 2   | 2   | 1   | 0   | 0   | 0   | 0   |
| Anticipate (13)       | 0   | 2   | 1   | 2   | 1   | 0   | 0   | 0   | 0   |
| Slide Tackle (14)     | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Bruiser (15)          | 0   | 2   | 1   | 2   | 1   | 0   | 0   | 0   | 1   |
| Technical (16)        | 0   | 0   | 0   | 0   | 1   | 2   | 2   | 2   | 1   |
| Rapid (17)            | 0   | 0   | 1   | 0   | 0   | 1   | 2   | 2   | 2   |
| First Touch (19)      | 0   | 0   | 0   | 0   | 1   | 2   | 1   | 2   | 2   |
| Trickster (20)        | 0   | 0   | 0   | 0   | 0   | 1   | 1   | 1   | 1   |
| Press Proven (21)     | 0   | 1   | 1   | 2   | 2   | 2   | 1   | 1   | 1   |
| Quick Step (22)       | 0   | 1   | 2   | 1   | 1   | 2   | 2   | 2   | 2   |
| Relentless (23)       | 0   | 1   | 2   | 2   | 2   | 0   | 1   | 1   | 1   |
| Acrobatic (25)        | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 1   | 1   |
| Long Throw (26)       | 0   | 0   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Far Throw (28)        | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Footwork (29)         | 2   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Cross Claimer (30)    | 2   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 1v1 Close Down (31)   | 2   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Far Reach (32)        | 2   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Deflector (33)        | 2   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Low Driven Shot (34)  | 0   | 0   | 0   | 0   | 1   | 1   | 1   | 1   | 1   |
| Aerial Fortress (35)  | 0   | 2   | 1   | 1   | 0   | 0   | 0   | 0   | 1   |
| Enforcer (36)         | 0   | 2   | 1   | 2   | 1   | 0   | 0   | 0   | 1   |
| Gamechanger (37)      | 0   | 0   | 0   | 0   | 1   | 2   | 1   | 2   | 2   |
| Inventive (38)        | 0   | 0   | 0   | 0   | 1   | 2   | 1   | 1   | 1   |
| Precision Header (39) | 0   | 1   | 0   | 0   | 0   | 0   | 0   | 1   | 2   |

The ids and names are FUT.GG's PlayStyle list (`/api/fut/playstyles/`, 36 entries on 2026-10-09). They become a rules module too, so the card detail and the playground can show PlayStyle names (STATUS next step 2).

### 2.6 Role+ and Role++ (B_role)

- **+1.0** if the card has Role++ in any role of the slot's position, otherwise **+0.5** if it has Role+ in one, otherwise 0.
- These are fixed, not fitted: the PRD asks for a small familiarity bonus, not a learned one.
- The role ids and their positions come from FUT.GG's role list (`/api/fut/roles/`, 49 roles; each has the EA id of its Role+ and Role++ version). They become a rules module as well.

## 3. Chemistry-style auto-selection

```
bestChemistryStyle(card, position, chemistry) → style | null
```

- It returns the style with the highest true rating at that position and chemistry, among goalkeeper styles for a goalkeeper and outfield styles otherwise.
- **Ties** go to the lower EA style id, so the result is deterministic.
- **At 0 chemistry** no style has any effect, so it returns `null` and the UI shows "Etkisiz".
- In the playground, each slot's style picker gets an **Otomatik** option, selected by default. Picking a style by hand still works.

## 4. Calibration

PRD §7.4 asks for calibration against third-party meta ratings, "so the result is sensible without copying them". The plan:

**Reference.** FUT.GG publishes a meta rating per card, per role and per chemistry style (`/api/fut/metarank/player/{eaId}/`; base Pelé has 152 scores: 8 roles × 19 styles). For a card, position and style, the reference is the best score among that position's roles.

- The metarank role ids are FUT.GG's own and are not in the role list. They come in one block per position (`METARANK_ROLE_POSITIONS` in `@fc27/calibration`), found by checking which positions the scored cards can play. The Role+ and Role++ flags in the metarank response do not match the cards' roles reliably, so they are not used.
- The scores are taken to be at full chemistry. The calibration PR checks this on a few cards whose style changes the face stats.

**Sample.**

- From the stored catalog, pick about 80 cards per position group, spread over the overall bands the sync already uses: about 700 cards.
- Each card gives one row per eligible position and chemistry style, about 20,000 rows.
- The script runs as a manually started GitHub Actions workflow, because FUT.GG serves GitHub's runners. It makes plain requests, one every two seconds, and stops on the first refusal. It never circumvents bot protection.
- The fetched sample is a workflow artifact. It is not committed, so the repository holds our weights and an accuracy report, not FUT.GG's ratings.

**Fit.**

- For each group, fit the attribute weights (non-negative, summing to 1), `c_wf`, `c_sm`, `c_acc`, `c_h` and `α`, plus the global `β`, by least squares with a small L2 penalty, so that no weight swings wildly on sparse data.
- The solver is Lawson and Hanson's active-set non-negative least squares in TypeScript, deterministic; no new language or service. AcceleRATE and height may take either sign, so each has a positive and a negative column, and the sum of the attribute weights is held to 1 by a heavily weighted penalty.
- `β` is the candidate (1, 1.5, 2, 2.5 or 3) with the lowest error on the training cards.
- Weights are rounded to 0.005 and renormalised before they are committed.
- 20 % of the cards (a fixed, seeded split) are held out and never used for fitting.

**Acceptance.** For every group, on the held-out cards:

- mean absolute error ≤ 1.5 points, and
- Spearman rank correlation ≥ 0.90.

If a group misses either bound, the calibration PR says so, with the numbers and a proposal, instead of loosening the bound silently.

The report (date, sample size, the two metrics per group, and the largest disagreements) is committed as `docs/domain/true-rating-calibration.md`. Re-running the calibration is how the weights follow a game update.

**First calibration (2026-10-09).** No group meets the mean-error bound, and CB, FB, CDM and ST miss the Spearman bound ([report](true-rating-calibration.md)):

- Mean absolute error is 1.7–3.0 points per group; Spearman is 0.85–0.97. FUT.GG's rating is not linear in the attributes: even fitted to all of a partial sample with a free scale and offset, a linear model missed it by 1.0–1.5 points on average, and rescaling our held-out ratings does not close the gap.
- 32 of the 573 cards with meta ratings have ratings that do not cover the card's primary position, apparently those of another version of the card, often 15–20 points lower. They are left out. Another 147 sampled cards have no meta ratings at all.
- The fit gives PlayStyles a weight of about 0: once the attributes are in, they explain nothing more of FUT.GG's rating.
- **Decision (owner, #24):** ship these weights, since the order of cards agrees well. The bounds stay as targets for a later model (for example, the best of several role-specific weightings, as FUT.GG does), not as a gate for re-calibrations.

## 5. Squad true rating

```
squadTrueRating = Σ p[slot] × trueRating[slot] / Σ p[slot]     over the 11 starting slots
```

- An empty slot counts as 0, as in the squad rating.
- Every position weight `p` starts at **1**, a plain average. The PRD allows positional weights, but there is no evidence yet for any other value, so they stay in the rules module for later.
- Each player is rated at the slot's position, with the slot's chemistry and their chosen (or automatic) style.

## 6. What the owner will see

- **Playground (`/oyun-alani`):**
  - Each filled slot shows "Gerçek reyting 87,4" next to the card's overall.
  - The style picker defaults to **Otomatik** and shows the chosen style.
  - The summary adds **Kadro gerçek reytingi** next to **Kadro reytingi** and **Takım kimyası**.
- **Card detail (`/katalog`):** the true rating at each position the card can play, with the best style at full chemistry, and the card's PlayStyle names.

## 7. Delivery plan

Each step is one pull request, test-first, with something visible on the preview.

1. **This document** (and the STATUS update).
2. **PlayStyle and role rules data.** PlayStyle names on the card detail and in the playground (STATUS next step 2).
3. **Per-style AcceleRATE in the catalog.** A migration adds a column, and the FUT.GG adapter stores `accelerateTypes` keyed by chemistry-style id. The card detail shows the AcceleRATE for each style.
4. **Calibration workflow and report.** The sampling workflow, the fit, the committed weights and `true-rating-calibration.md`.
5. **True rating in the domain and the UI.** `trueRating`, `bestChemistryStyle` and `squadTrueRating`, with the playground and card-detail changes in §6.

**Tests.** The formula tests use a small weights table written in the test, so every expected value can be worked out by hand and shown in a comment. The shipped weights are tested only for their invariants (non-negative, summing to 1, every group present), because their values come from the fit. The coverage and mutation gates stay as they are.

## 8. Known limitations

- AcceleRATE at 1 or 2 chemistry uses the base type (§2.3).
- Body type is not used (§2.4).
- Left- and right-sided positions share weights; the preferred foot is ignored.
- The PlayStyle relevance table is a judgement call. The owner can correct any cell; it is data.
- The result is only as good as the meta ratings it is calibrated against. Where the owner's experience in the game disagrees, the fix is a weight or table change, recorded in the calibration report.
