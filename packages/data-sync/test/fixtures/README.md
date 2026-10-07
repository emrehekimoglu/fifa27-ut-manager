# Test fixtures

Real responses captured on 2026-10-07. They are trimmed only by removing whole items, never by editing values.

| File                               | Source                                                                              | Contents                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `futgg-definitions-page.json`      | `GET https://www.fut.gg/api/fut/players/v2/27/definitions/?page=N`                  | Four items from pages 1, 2, 3 and 40. Page metadata (`next`, `currentPage`, `total`) is from page 3. |
| `futgg-definitions-last-page.json` | Same endpoint, `page=334`                                                           | The first item of the last page, where `next` is `null`.                                             |
| `ea-ratings-page.json`             | `GET https://drop-api.ea.com/rating/ea-sports-fc` (with the `drop-referrer` header) | Three items from offsets 0–2000; `totalItems` from the same run.                                     |

The four FUT.GG items are:

- Pelé, Base Icon (CAM)
- Takefusa Kubo, Rare (RM)
- Thibaut Courtois, Rare (GK)
- Gianluigi Donnarumma, Team of the Week (GK)

The three EA items are:

- Kylian Mbappé (ST)
- Thibaut Courtois (GK)
- Erling Haaland (ST, `alternatePositions: null`)
