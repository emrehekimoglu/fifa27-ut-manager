# Security policy

## Scope

This is a private application for two users. The repository is public, so its main security concern is keeping secrets and personal data out of the repository and keeping access to the deployed app restricted.

## Handling secrets

- Secrets are never committed. CI reads them from GitHub repository secrets, and runtime services read them from their platform's encrypted environment variables.
- Every push and pull request is scanned with gitleaks. GitHub secret scanning and push protection should be enabled in the repository settings.
- A secret that was ever committed is considered compromised and must be **rotated**. Rewriting history does not undo exposure.
- Some values are public by design (for example the Supabase URL and anon key that every browser receives). They are not committed either. Security for the data behind them relies on row-level security, not on keeping them secret.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting ("Report a vulnerability" on the Security tab) or contact the repository owner directly.
