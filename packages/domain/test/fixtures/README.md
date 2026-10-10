# Test fixtures

Values published by FUT.GG on 2026-10-09, used to cross-check the rules data in `src/rules`. The page captures are copied without editing; the API captures keep only the fields listed.

| File                              | Source                                              | Contents                                                                                |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `futgg-tactics-slots.json`        | `https://www.fut.gg/tactics/<formation>/`, 29 pages | The slot list of each formation page, goalkeeper first, keyed by the page's address.    |
| `futgg-chemistry-face-gains.json` | `https://www.fut.gg/chemistry-styles/`              | The face-stat gains at 3 chemistry the page shows for all 24 styles.                    |
| `futgg-playstyles.json`           | `https://www.fut.gg/api/fut/playstyles/`            | All 36 PlayStyles in the response order: `eaId`, `name`, `category`.                    |
| `futgg-roles.json`                | `https://www.fut.gg/api/fut/roles/`                 | All 49 roles in the response order: `name`, `positionName`, `plusEaId`, `plusPlusEaId`. |
