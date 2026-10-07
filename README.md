# FC 27 UT Manager

A private web app for building EA SPORTS FC 27 Ultimate Team squads. It shows game-accurate squad metrics, a position-aware "true rating", and price-aware player recommendations for the empty slots in a squad.

> **Status:** in development. Milestone M0 (foundation) is under way. See the [PRD](docs/product/PRD.md) for scope and the milestone plan.

## Documentation

| Document                                      | Purpose                                            |
| --------------------------------------------- | -------------------------------------------------- |
| [Product requirements](docs/product/PRD.md)   | Scope, requirements, domain rules, milestones      |
| [Contributing guide](CONTRIBUTING.md)         | Workflow, test-first rules, branches, commits, PRs |
| [Architecture decisions](docs/adr/README.md)  | ADR log                                            |
| [Deployment guide](docs/guides/deployment.md) | Vercel setup and environments                      |
| [Security policy](SECURITY.md)                | Secrets handling and reporting issues              |
| [Changelog](CHANGELOG.md)                     | Release history                                    |

## Repository layout

```
apps/
  web/              React + Vite web app (PWA in later milestones)
packages/           Shared packages (domain engine, data sync, game data), added in later milestones
docs/
  product/          Product requirements
  adr/              Architecture decision records
  guides/           How-to guides
.github/            CI workflows, templates, Dependabot
```

## Getting started

Prerequisites: Node.js 24 (see `.nvmrc`) and pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm dev            # start the web app at http://localhost:5173
```

## Scripts

| Command                             | Description                                              |
| ----------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                          | Start the web app in development mode                    |
| `pnpm build`                        | Type-check and build all packages                        |
| `pnpm lint`                         | Run ESLint                                               |
| `pnpm format` / `pnpm format:check` | Format or check formatting with Prettier                 |
| `pnpm typecheck`                    | Type-check all packages                                  |
| `pnpm test`                         | Unit tests with coverage thresholds                      |
| `pnpm test:mutation`                | Mutation tests (Stryker) with score thresholds           |
| `pnpm test:e2e`                     | End-to-end tests (Playwright, desktop and 360 px mobile) |

## Data and usage

This is a personal, non-commercial project for two users. It is not affiliated with or endorsed by EA SPORTS or by any data source it reads. See PRD §6 for how data is acquired and the constraints the project follows.
