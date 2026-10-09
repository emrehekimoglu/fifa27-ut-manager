# Architecture decision records

We record significant technical decisions as ADRs, following [Michael Nygard's format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Process

1. Copy [`0000-template.md`](0000-template.md) to `NNNN-short-title.md`, using the next free number.
2. Fill it in with status **Proposed**, and open it in the pull request that introduces the decision.
3. When the PR is merged, set the status to **Accepted**.
4. Never rewrite an accepted ADR. To reverse a decision, write a new ADR that supersedes it, and mark the old one **Superseded by ADR-NNNN**.

## Log

| ADR                                               | Title                             | Status   |
| ------------------------------------------------- | --------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)     | Record architecture decisions     | Accepted |
| [0002](0002-monorepo-and-toolchain.md)            | Monorepo and toolchain            | Accepted |
| [0003](0003-card-data-sources.md)                 | Card data sources                 | Accepted |
| [0004](0004-price-acquisition.md)                 | Price acquisition                 | Accepted |
| [0005](0005-catalog-storage-and-sync.md)          | Catalog storage and sync          | Accepted |
| [0006](0006-game-rules-data-and-domain-engine.md) | Game rules data and domain engine | Proposed |
| [0007](0007-ui-foundation.md)                     | UI foundation                     | Proposed |
