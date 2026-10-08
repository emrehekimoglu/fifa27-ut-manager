# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Product requirements document for v0.1.
- pnpm monorepo with a React + Vite web app, strict TypeScript, ESLint and Prettier.
- Test tooling: Vitest with coverage thresholds, Stryker mutation testing, and Playwright end-to-end tests on desktop and 360 px mobile.
- CI pipeline with format, lint, type, unit, mutation, e2e, commit-message and secret-scan checks.
- Landing page showing the deployed build (version, commit, environment).
- Contributing guide, security policy, ADR log and deployment guide.
- Data source spike results: ADR-0003 (card data sources) and ADR-0004 (price acquisition via a home price agent).
- `@fc27/data-sync` package with schema-validated FUT.GG and EA card adapters and a source health check.
- `/kaynaklar` page and `/api/source-health` endpoint showing the live status of both card sources and the price-access results.
- Scheduled live contract tests for the card sources.
- All-rights-reserved license.
- Catalog storage in Supabase (ADR-0005): migrations, a daily sync workflow that reads FUT.GG in overall-rating partitions, validates the result and keeps the last good catalog on failure, and a production migration workflow.
- Catalog sync status on the `/kaynaklar` page.
- Database integration tests against a local Supabase stack in CI.

### Fixed

- Cards without a club, such as heroes, no longer fail FUT.GG validation. They broke the catalog sync and the FUT.GG health check, and the source page names their league instead of a club.
- EA cards no longer show FC 25 card images, which EA's API still links and which show outdated cards; the source page shows a placeholder instead.
- A catalog bootstrapped from EA keeps the reason FUT.GG could not be used in its sync record, so the source page shows it.
