-- Row-level security for the allow-list (ADR-0008, PRD AUTH-2).
-- Runs with `supabase test db` against the local stack, never against production.
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Three accounts: an allow-listed Google account, a Google account that is not on
-- the list, and an e-mail/password account that claims an allow-listed address.
insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'oyuncu@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'yabanci@example.com'),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'arkadas@example.com');

insert into auth.identities (provider_id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values
  ('google-oyuncu', '11111111-1111-4111-8111-111111111111', 'google',
   '{"sub": "google-oyuncu", "email": "Oyuncu@Example.com", "email_verified": true}', now(), now(), now()),
  ('google-yabanci', '22222222-2222-4222-8222-222222222222', 'google',
   '{"sub": "google-yabanci", "email": "yabanci@example.com", "email_verified": true}', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'email',
   '{"sub": "33333333-3333-4333-8333-333333333333", "email": "arkadas@example.com"}', now(), now(), now());

insert into public.allowed_users (email) values ('oyuncu@example.com'), ('arkadas@example.com');

-- Exactly one sync and one card, so every reader either sees one row or none.
-- The integration tests run first and leave their rows; the rollback restores them.
delete from public.cards;
delete from public.catalog_syncs;

insert into public.catalog_syncs (started_at, finished_at, status, source, card_count, deactivated_count)
values ('2026-10-16T03:47:00Z', '2026-10-16T03:52:00Z', 'succeeded', 'futgg', 1, 0);

insert into public.cards (
  ea_id, base_player_ea_id, name, search_name, overall, position, alternate_positions,
  club_ea_id, club_name, league_name, nation_ea_id, nation_name, is_untradeable, source, data,
  last_seen_sync_id
)
select 1, 1, 'Test Oyuncu', 'test oyuncu', 80, 'ST', '{}', 1, 'Test FC', 'Test Lig', 1, 'Türkiye',
  false, 'futgg', '{}', id
from public.catalog_syncs;

-- Visitors who are not signed in see nothing.
set local role anon;
select is((select count(*) from public.cards), 0::bigint, 'anon reads no cards');
select is((select count(*) from public.catalog_syncs), 0::bigint, 'anon reads no syncs');
reset role;

-- The allow-listed Google account reads the catalog; the address matches case-insensitively.
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is(public.is_allowed(), true, 'an allow-listed Google account is allowed');
select is((select count(*) from public.cards), 1::bigint, 'an allow-listed account reads the cards');
select is((select count(*) from public.catalog_syncs), 1::bigint, 'an allow-listed account reads the syncs');
select throws_ok(
  'select count(*) from public.allowed_users',
  '42501'::char(5),
  null::text,
  'nobody reads the allow-list through the API'
);
reset role;

-- Any other Google account sees nothing.
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is(public.is_allowed(), false, 'a Google account that is not listed is not allowed');
select is((select count(*) from public.cards), 0::bigint, 'an unlisted account reads no cards');
select is((select count(*) from public.catalog_syncs), 0::bigint, 'an unlisted account reads no syncs');
reset role;

-- An allow-listed address is not enough without Google having verified it.
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';
select is(public.is_allowed(), false, 'an e-mail sign-in with a listed address is not allowed');
select is((select count(*) from public.cards), 0::bigint, 'an e-mail sign-in reads no cards');
reset role;

-- Addresses are stored lower-case, so a match never depends on spelling.
select throws_ok(
  $$insert into public.allowed_users (email) values ('Buyuk@Example.com')$$,
  '23514'::char(5),
  null::text,
  'the allow-list only takes lower-case addresses'
);

select * from finish();
rollback;
