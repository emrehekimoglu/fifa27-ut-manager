# Deployment guide

The web app is hosted on **Vercel**:

- Every push to a pull request branch gets a **preview deployment** with its own URL.
- Every merge to `main` updates the **production deployment**.

## One-time setup (repository owner)

1. Sign in at [vercel.com](https://vercel.com) with the GitHub account that owns this repository. The free Hobby plan is enough.
2. Choose **Add New… → Project**, and import `fifa27-ut-manager`. If the repository is not listed, grant the Vercel GitHub app access to it.
3. In the import screen:
   - **Root Directory:** `apps/web` (click _Edit_ and select it).
   - **Framework Preset:** Vite. It is detected automatically; `apps/web/vercel.json` also sets it.
   - Leave **Build and Output Settings** as they are. They come from `apps/web/vercel.json`: build command `pnpm build`, output directory `dist`.
   - Leave **Environment Variables** empty for now.
4. Click **Deploy**. The first production deployment builds `main`.
5. Under **Project → Settings → Git**, make sure the production branch is `main`. Preview deployments for other branches are on by default.

After this, Vercel comments the preview URL on every pull request, and the PR shows a deployment status check.

## Verifying a deployment

The footer of every page shows the deployed build: `v<version> · <commit> · <environment>`.

| Environment label | Meaning                              |
| ----------------- | ------------------------------------ |
| `Canlı`           | Production deployment (`main`)       |
| `Önizleme`        | Preview deployment of a pull request |
| `Yerel`           | A local build                        |

The commit must match the head commit of the PR you are verifying.

## Supabase (database)

The card catalog lives in a Supabase project (ADR-0005).

### One-time setup

1. Create a project at [supabase.com](https://supabase.com). The free plan is enough. Choose a European region.
2. Collect the values listed in the table below:
   - **Project URL:** the **Connect** dialog.
   - **Publishable and secret keys:** **Project Settings → API Keys**, tab _Publishable and secret API keys_. If you only see a _Create new API keys_ button, click it first.
   - **Database URL:** **Connect → Session pooler**. Replace `[YOUR-PASSWORD]` with the database password.
3. Store each value where the table says. Never commit them; see [SECURITY.md](../../SECURITY.md).
4. Run the **Database migrations** workflow once (GitHub → Actions → _Database migrations_ → _Run workflow_). It creates the tables.
5. Run the **Catalog sync** workflow once to fill the catalog, which takes about 20 minutes. After that it runs daily at 03:47 UTC.

### Secrets and variables

| Name                            | Value                                           | Where                                                | Used by             |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------- | ------------------- |
| `SUPABASE_URL`                  | Project URL                                     | GitHub Actions secret                                | Catalog sync        |
| `SUPABASE_SECRET_KEY`           | `sb_secret_…` key                               | GitHub Actions secret                                | Catalog sync        |
| `SUPABASE_DB_URL`               | Session pooler connection string, with password | GitHub Actions secret                                | Database migrations |
| `VITE_SUPABASE_URL`             | Project URL                                     | Vercel environment variable (Production and Preview) | Web app             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` key                          | Vercel environment variable (Production and Preview) | Web app             |

- **The publishable key is public by design.** Row-level security protects the data.
- **The secret key and database URL grant full access.** They belong only in GitHub secrets.
- **Vercel bakes `VITE_*` variables into the build.** After changing them, redeploy.

## Environment variables and secrets

- **Register each new variable** in Vercel under **Settings → Environment Variables**, separately for Production and Preview where needed.
- **Document each variable** in `.env.example` with a placeholder.
- **Put values used by CI** in GitHub under **Settings → Secrets and variables → Actions**.
- **Keep real values out of the repository** (see [SECURITY.md](../../SECURITY.md)).

## Recommended repository settings

Configure these in GitHub under **Settings**.

- **Code security:**
  - Enable _Secret scanning_ and _Push protection_.
  - Enable _Private vulnerability reporting_.
  - Enable _Dependabot alerts_.
- **Branches → Add branch ruleset for `main`:**
  - Require a pull request before merging.
  - Require these status checks to pass:
    - _Format, lint, types and unit tests_
    - _Mutation tests_
    - _End-to-end tests_
    - _Conventional commits_
    - _Secret scan_
    - _Database integration tests_
  - Block force pushes.
