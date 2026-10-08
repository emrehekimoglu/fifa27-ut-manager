# ADR-0003: Card data sources

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The app needs every FC 27 Ultimate Team card that can be bought on the market or held in a club (PRD CAT-1, CAT-2). For each card it needs:

- full sub-attributes and face stats, positions and alternate positions;
- PlayStyles / PlayStyles+ and Player Roles (+/++);
- AcceleRATE, height and weight;
- club, league and nation;
- special chemistry behaviour (icons, heroes);
- card images.

The milestone M1 spike tested each candidate source on 2026-10-07. Tests ran from a cloud (datacenter) IP and, for prices, also from the owner's home connection.

| Source                                                                                                           | Result                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FUT.GG `GET /api/fut/players/v2/27/definitions/?page=N`                                                          | **200 JSON** from a datacenter IP, no key. 30 cards per page. A single query is capped at 10,000 results (page 334 has `next: null`). Every field in CAT-2 is present, plus a chemistry profile (`isFullChemistry`, `extraSquadLeagueChemistry`, `extraSquadNationChemistry`, …) and image paths. Promos, icons and holographic variants are separate items keyed by `eaId`, with `basePlayerEaId` linking the versions. |
| FUT.GG `GET /api/fut/player-item-definitions/27/{eaId}/`                                                         | **200 JSON**, a single card.                                                                                                                                                                                                                                                                                                                                                                                             |
| EA `GET drop-api.ea.com/rating/ea-sports-fc` with `drop-referrer: https://www.ea.com/games/ea-sports-fc/ratings` | **200 JSON**, 19,789 base cards with full attributes, positions and EA IDs for club and nation. It has **no league ID** (only a name), no promos, no AcceleRATE, no roles, and blank height and weight. Its image URLs still point to FC 25 images, which show outdated cards, so EA cards carry no image.                                                                                                               |
| FUTDatabase API (`api.futdatabase.com`)                                                                          | API online (OpenAPI spec reachable, key sent as `X-AUTH-TOKEN`). The sign-up site is unreachable for the owner (it redirects to an unrelated page), so no key can be obtained.                                                                                                                                                                                                                                           |
| CORS                                                                                                             | Neither FUT.GG nor EA sends `Access-Control-Allow-Origin` for our origin, so the browser cannot call them directly.                                                                                                                                                                                                                                                                                                      |

## Decision

1. **FUT.GG is the primary card source.**
   - The catalog is read from the definitions endpoint. Requests are server-side only (scheduled job or serverless function), politely paced and identified by a normal user agent.
   - To work around the 10,000-result cap, queries are partitioned so that each partition stays under the cap. The partitioning scheme is decided in M2.
2. **EA's ratings API is the fallback.** It is used for base cards when FUT.GG fails or returns data that fails validation.
   - In fallback mode the catalog lacks promos, AcceleRATE and roles, and the league must be matched by name. The UI shows that the catalog is degraded.
3. **FUTDatabase is not used.** We can revisit it if the owner obtains a key.
4. **All source responses are validated against a schema** before use. A response that fails validation counts as a source failure and triggers the fallback. It never produces partial data.
5. **Cards are keyed by `eaId`.** Position IDs are shared by both sources. The mapping below was verified against the position labels EA's API returns, on a sample of 600 cards:

   | ID  | Position | ID  | Position | ID  | Position |
   | --- | -------- | --- | -------- | --- | -------- |
   | 0   | GK       | 12  | RM       | 23  | RW       |
   | 3   | RB       | 14  | CM       | 25  | ST       |
   | 5   | CB       | 16  | LM       | 27  | LW       |
   | 7   | LB       | 18  | CAM      |     |          |
   | 10  | CDM      |     |          |     |          |

   Two source quirks:

   - FUT.GG's `foot` field is `1 = right` and `2 = left` (checked against known left-footed players).
   - EA sends `alternatePositions: null` instead of an empty list for some cards (189 of 600 sampled).

## Alternatives considered

- **FUTDatabase as the fallback:** no way to obtain a key (see above).
- **Scraping FUT.GG or FUTBIN HTML for card data:** this is unnecessary, because a structured JSON source exists.
- **EA's API as the primary source:** it lacks promos, PlayStyles, roles and AcceleRATE, which are required for the true rating (PRD §7.4).

## Consequences

- FUT.GG's endpoint is undocumented and can change without notice. To mitigate this:
  - responses go through schema validation;
  - a scheduled **contract test** job runs against the live endpoints and fails loudly when the shape changes;
  - the last good catalog is kept (PRD §6.1, NFR-4).
- When FUT.GG is down, promo cards are unavailable until it recovers.
- The source-health page (M1 demo) shows both sources' live status and sample cards.
