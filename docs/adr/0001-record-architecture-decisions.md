# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The project is developed in increments over a long period, partly with tool assistance across separate sessions. Decisions and their reasons have to stay discoverable. Otherwise they get re-litigated or reversed by accident.

## Decision

We will record every significant technical decision as an ADR in `docs/adr`, following the process in [`README.md`](README.md).

## Alternatives considered

- **Decisions only in PR descriptions:** hard to find later, and not versioned with the code.
- **A single design document:** it would grow unwieldy, and it loses the history of why a decision changed.

## Consequences

- Each significant decision costs a short document.
- New contributors and new sessions can find the reasoning in one place.
