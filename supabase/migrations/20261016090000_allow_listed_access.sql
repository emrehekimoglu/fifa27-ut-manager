-- Only the two allow-listed Google accounts may read data (ADR-0008, PRD AUTH-2).

-- The allow-list. Its rows are personal data: they are added in the Supabase SQL
-- editor (docs/guides/sign-in.md) and never committed.
create table public.allowed_users (
  email text primary key check (email = lower(email))
);

comment on table public.allowed_users is 'Google accounts allowed to use the app, by lower-case e-mail.';

-- Only the secret key (which bypasses RLS and these grants) reads or changes the list.
alter table public.allowed_users enable row level security;
revoke all on public.allowed_users from anon, authenticated;

-- True when the signed-in user has a Google identity whose e-mail is on the list.
-- Google verifies that address; an e-mail/password account with the same address does not count.
create function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.identities as identity
    join public.allowed_users as allowed
      on allowed.email = lower(identity.identity_data ->> 'email')
    where identity.user_id = auth.uid()
      and identity.provider = 'google'
  );
$$;

comment on function public.is_allowed() is 'Whether the signed-in user is an allow-listed Google account.';

revoke execute on function public.is_allowed() from public, anon;
grant execute on function public.is_allowed() to authenticated;

-- Reads were open to everyone until sign-in existed (20261007210000_catalog.sql).
drop policy "cards are readable" on public.cards;
drop policy "catalog syncs are readable" on public.catalog_syncs;

create policy "allow-listed users read cards" on public.cards
  for select to authenticated using ((select public.is_allowed()));

create policy "allow-listed users read catalog syncs" on public.catalog_syncs
  for select to authenticated using ((select public.is_allowed()));
