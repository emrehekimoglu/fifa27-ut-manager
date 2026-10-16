# ADR-0008: Sign-in and access control

- **Status:** Proposed
- **Date:** 2026-10-16

## Context

The PRD limits the app to two people (AUTH-1, AUTH-2): both sign in with Google, and any other account is rejected. Until now, the production site had no sign-in, and row-level security let anyone with the public Supabase key read the catalog (ADR-0005).

The owner now also wants data that may only be shown privately. On 2026-10-16 they chose to build sign-in before that data arrives, so that nothing new is ever readable by the public. The repository itself stays public (PRD §9.1).

## Decision

**1. Google sign-in through Supabase Auth.**

- The web app calls `signInWithOAuth({ provider: 'google' })` with the page the user was on as the return address. Supabase handles the Google exchange and stores the session in the browser.
- Signing out uses `scope: 'local'`, so it ends the session on that device only (AUTH-3).
- Supabase's e-mail/password provider is switched off in the dashboard. Google is the only way in.

**2. The allow-list lives in the database, never in the repository.**

- Table `public.allowed_users` has one lower-case e-mail per allowed account. The owner adds the rows in the Supabase SQL editor ([guide](../guides/sign-in.md)). The addresses are personal data, so they are never committed.
- `anon` and `authenticated` have no grants on the table. Only the secret key reads or changes it.

**3. Row-level security enforces the list on every read.**

- `public.is_allowed()` is true when the signed-in user has a **Google** identity whose e-mail is on the list. Google has verified that address. An e-mail/password account that claims the same address does not count, even if that provider is ever switched back on.
- `cards` and `catalog_syncs` are readable only `to authenticated using (is_allowed())`. The policy for public reads is dropped.
- Writes are unchanged: only the secret key writes.
- Every new table with private data follows the same rule: RLS on, and reads only through `is_allowed()`.

**4. The app shows a gate, the database decides.**

- On load and on every sign-in or sign-out, the app reads the stored session and calls `is_allowed()`. Signed out, it shows **Giriş yap** with a Google button. A signed-in account that is not on the list sees **Erişim yok** and can sign out. When the check fails, the app shows the error with **Tekrar dene**.
- The main menu and the account menu appear only for an allowed account.
- This screen is a convenience. The protection is RLS: a modified client still reads nothing.

**5. Second line at Google.** The Google OAuth app stays in **Testing** with the two accounts as test users. Google then refuses any other account before Supabase sees it.

**6. Tests.**

- A pgTAP suite (`supabase/tests/database`) runs on the local Supabase stack in CI with `supabase test db`. It checks that anonymous users, unlisted Google accounts and e-mail accounts with a listed address read nothing, and that a listed Google account reads the catalog.
- The e2e suite starts each page with a stored session and answers `is_allowed` through route mocks.

## Alternatives considered

- **E-mails in an environment variable checked by the web app:** the check would run only in the browser, so the public Supabase key could still read every table. Rejected.
- **A `before user created` auth hook that blocks sign-ups:** it stops unknown accounts from being created, but it does not protect reads by itself, and it needs an extra dashboard setting. It may be added later as a third line. RLS stays the protection.
- **Checking the e-mail claim in the JWT:** an e-mail/password sign-up with a listed address would pass if that provider were ever re-enabled with confirmations off. The Google identity check does not have that gap.
- **A private repository instead of sign-in:** it would hide the code but not the production site or the database. The owner chose sign-in first.

## Consequences

- The production site shows only the sign-in screen until the owner sets up Google, Supabase and the allow-list ([guide](../guides/sign-in.md)).
- The migration removes public reads. Between running it and merging the app change, the old production app shows an empty catalog. The guide orders the steps so this gap is short.
- `/api/source-health` stays public. It reports only EA's public sample, never stored or private data. Any future server endpoint that returns stored data must check the caller's session first.
- Per-user data in M4 (squads, clubs) adds `user_id = auth.uid()` on top of `is_allowed()`.
