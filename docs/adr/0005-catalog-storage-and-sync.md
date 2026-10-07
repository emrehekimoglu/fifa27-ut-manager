# ADR-0005: Catalog storage and sync

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

ADR-0003 chose FUT.GG's definitions endpoint as the card source and EA's ratings API as the fallback. Milestone M2 needs the catalog stored, refreshed daily, and protected against partial or broken fetches (PRD §6.1, NFR-4).

A full crawl on 2026-10-07 established the following.

**Query cap and partitioning**

FUT.GG returns at most 10,000 results per query. The `overall__gte` / `overall__lte` filters split the catalog into bands that each stay below the cap:

| Band  | 0–59  | 60–64 | 65–69     | 70–74 | 75–79 | 80–84 | 85–99 |
| ----- | ----- | ----- | --------- | ----- | ----- | ----- | ----- |
| Cards | 2,765 | 4,375 | **5,925** | 3,896 | 1,763 | 754   | 480   |

That is **19,958 cards in total**.

**Paging is only stable in FUT.GG's default order**

- With `sorts=overall`, paging returns some cards twice and skips others:
  - 85–99: 469 of 480 unique;
  - 60–64: 4,282 of 4,375 unique.
- Without a sort parameter, every band returned exactly its reported total, in identical order across repeated runs.

**Transient errors happen**

One page request failed with a network error during the crawl.

**EA's ratings database is not the Ultimate Team catalog**

- About 1,000 EA base cards appear in FUT.GG under a different item ID, `eaId = basePlayerEaId + n · 50,331,648`. These are updated base items. `basePlayerEaId` still equals EA's ID.
- 418 EA players (about 2 %) do not exist in FUT.GG at all; FUT.GG's single-item endpoint answers 404 for them. These are players without an Ultimate Team item.

## Decision

**1. Storage: Supabase Postgres, schema managed as migrations in `supabase/migrations`**

- `catalog_syncs` has one row per sync run: status, source, card count, deactivated count and error.
- `cards` has one row per card version, keyed by `eaId`. It stores:
  - the full `CatalogCard` as `jsonb`;
  - filterable columns: name, accent-free `search_name` with a trigram index, overall, positions, club, league, nation, rarity;
  - an `is_active` flag and `last_seen_sync_id`.
- Row-level security is on, with read-only policies. Only the secret key, which bypasses RLS, can write. Reads are open for now, because the data is public game data; M4 restricts them to signed-in, allow-listed users.

**2. Fetch: the seven bands above, no sort parameter, about one request per second**

- A partition whose unique cards fall short of the reported total is re-read, up to three passes, and the passes are merged.
- A partition still short after three passes fails the sync.
- A partition at the cap fails the sync, because cards would be hidden.

**3. Validation before writing**

- At least 15,000 cards.
- No more than 5 % fewer cards than the last successful sync.

**4. Write**

- Upsert all cards in batches of 500, marking them as seen by this sync.
- Mark active cards not seen by this sync as inactive. They are kept, never deleted, because squads may reference them.

**5. Failure policy (refines ADR-0003 decision 2)**

- **Catalog already exists and FUT.GG fails** (error, incomplete partition or failed validation): the sync is recorded as failed and the stored catalog is not touched. EA is not used here: its data lacks promos, PlayStyles and roles, so writing it would degrade a richer catalog.
- **Catalog is still empty:** the sync bootstraps it from EA's base cards. The next successful FUT.GG sync then replaces those rows. EA-only items, such as non-UT players and old item IDs, become inactive, because FUT.GG never reports them.

**6. Scheduling**

- A GitHub Actions workflow runs the sync daily at 03:47 UTC and on demand. A failed sync fails the run, which notifies the owner by e-mail.
- Migrations are applied to production by a separate workflow on pushes to `main` that change `supabase/migrations`, using `SUPABASE_DB_URL`.

**7. Testing**

- Sync logic is unit-tested with an in-memory `CatalogStore`.
- One contract suite runs against both the in-memory store and the Supabase store. The Supabase run uses a throwaway local stack (`supabase start`) in CI, built from the repository's migrations, so production is never touched.

## Alternatives considered

- **Sorting by overall with a tie-breaker:** `sorts=overall,eaId` happened to return complete bands, but the parameter is undocumented. The default order was stable in every run, and the multi-pass merge covers residual instability.
- **Smaller partitions, e.g. per position:** they need more requests and do not fix unstable paging.
- **Falling back to EA after every FUT.GG failure:** this would overwrite promo and PlayStyle data with poorer data.
- **Static JSON committed to the repository:** a 20,000-card file that changes daily would bloat the history, and it cannot be queried with search and filters (M2 catalog browser).
- **Deleting vanished cards:** squads and price history will reference card IDs, so deactivating keeps those references valid.

## Consequences

- A full sync takes about 670 requests, roughly 15–25 minutes, well within the 60-minute job timeout.
- A failed sync leaves the previous day's catalog in place; the source page shows the failure.
- If the catalog grows past the cap in a band (5,925 of 10,000 today), the sync fails loudly. The fix is a data change to `CATALOG_PARTITIONS`.
- Integration tests need Docker. They run in CI and locally with `supabase start`.
