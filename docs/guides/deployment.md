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

Each value is copied from Supabase and pasted into GitHub or Vercel. Never paste a value anywhere else, and never commit it; see [SECURITY.md](../../SECURITY.md).

**A. Create the project**

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) with GitHub.
2. Click **New project** and fill in the form:
   - **Name:** `fifa27-ut-manager`.
   - **Database password:** click **Generate a password**, then copy the password into a password manager. You need it for step D. A password of only letters and digits avoids escaping problems in the connection string.
   - **Region:** a European one, for example Frankfurt.
   - The plan stays **Free**.
3. Click **Create new project** and wait until the dashboard stops showing _Setting up project_.

**B. Project URL** (`SUPABASE_URL`, `VITE_SUPABASE_URL`)

1. Look at the browser's address bar. It reads `https://supabase.com/dashboard/project/<project-ref>`.
2. The project URL is `https://<project-ref>.supabase.co`. For example, the address `…/project/abcdefghijklmnop` gives `https://abcdefghijklmnop.supabase.co`.

**C. API keys** (`VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)

1. Click the gear icon (**Project Settings**) at the bottom of the left sidebar, then **API Keys**.
2. If the page only shows a **Create new API keys** button, click it.
3. **Publishable key:** the value starting with `sb_publishable_`. Copy it with the copy icon next to it.
4. **Secret key:** the value starting with `sb_secret_`. Click the eye icon to reveal it, then copy it.

**D. Database connection string** (`SUPABASE_DB_URL`)

GitHub's runners only have IPv4. The direct connection on the free plan is IPv6-only, so the migration workflow must use the **session pooler**, which listens on IPv4.

1. Open the project dashboard and click **Connect** in the top bar. A dialog opens. The link [supabase.com/dashboard/project/\_?showConnect=true&method=session](https://supabase.com/dashboard/project/_?showConnect=true&method=session) opens it with the session pooler preselected.
2. In the dialog, open the **Connection String** tab.
3. Set the dropdowns:
   - **Type:** `URI`.
   - **Source:** `Primary Database`.
   - **Method:** `Session pooler`. The default is `Direct connection`, which is the wrong one.
4. Copy the string shown under **Session pooler**. It has the form `postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-<n>-<region>.pooler.supabase.com:5432/postgres`.
   - It starts with `postgres.<project-ref>`, not with plain `postgres`.
   - It ends with port `5432`, not `6543`.
5. Replace `[YOUR-PASSWORD]`, including the brackets, with the database password from step A.
   - If you no longer have the password, reset it under **Project Settings → Database → Reset database password**.

**E. Store the values**

1. GitHub secrets:
   - Open the repository on GitHub and go to **Settings → Secrets and variables → Actions**.
   - Click **New repository secret** and enter the **Name** from the table below and the **Secret** value. Click **Add secret**.
   - Repeat for every GitHub secret in the table.
2. Vercel variables:
   - Open the project on [vercel.com](https://vercel.com) and go to **Settings → Environment Variables**.
   - Enter the **Key** and **Value**.
   - Set the variable type to **Config**, not **Secret**. Both values are public by design, and Vercel refuses a `VITE_` variable of type **Secret** with the warning _Keep This Value Private_.
   - Select the **Production** and **Preview** environments, then click **Save**.
   - Repeat for every Vercel variable in the table.
3. Redeploy, because Vercel bakes `VITE_*` values into the build:
   - Go to **Deployments**.
   - Open the **⋯** menu of the deployment you want to refresh and choose **Redeploy**.

**F. Create the tables and fill the catalog**

1. Run the **Database migrations** workflow once: GitHub → **Actions** → _Database migrations_ → **Run workflow**. It creates the tables, and it runs automatically on every later merge that changes `supabase/migrations`.
2. Run the **Catalog sync** workflow once the same way. It fills the catalog in about 20 minutes, and from then on runs daily at 03:47 UTC.

### Secrets and variables

| Name                            | Value                                           | Where                                               | Used by             |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------------- | ------------------- |
| `SUPABASE_URL`                  | Project URL                                     | GitHub Actions secret                               | Catalog sync        |
| `SUPABASE_SECRET_KEY`           | `sb_secret_…` key                               | GitHub Actions secret                               | Catalog sync        |
| `SUPABASE_DB_URL`               | Session pooler connection string, with password | GitHub Actions secret                               | Database migrations |
| `VITE_SUPABASE_URL`             | Project URL                                     | Vercel **Config** variable (Production and Preview) | Web app             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` key                          | Vercel **Config** variable (Production and Preview) | Web app             |

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
