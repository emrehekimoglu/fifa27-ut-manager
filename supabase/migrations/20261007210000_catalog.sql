-- Card catalog and its synchronisation log (ADR-0005).

create extension if not exists pg_trgm with schema extensions;

create table public.catalog_syncs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  source text check (source in ('futgg', 'ea')),
  card_count integer check (card_count >= 0),
  deactivated_count integer check (deactivated_count >= 0),
  error text
);

comment on table public.catalog_syncs is 'One row per catalog sync run.';

create table public.cards (
  ea_id bigint primary key,
  base_player_ea_id bigint not null,
  name text not null,
  -- Lower-case, accent-free name for search (toSearchName in @fc27/data-sync).
  search_name text not null,
  overall smallint not null check (overall between 0 and 99),
  position text not null,
  alternate_positions text[] not null,
  rarity_ea_id integer,
  rarity_name text,
  club_ea_id integer not null,
  club_name text not null,
  league_ea_id integer,
  league_name text not null,
  nation_ea_id integer not null,
  nation_name text not null,
  is_untradeable boolean not null,
  source text not null check (source in ('futgg', 'ea')),
  -- The full CatalogCard as produced by the source adapter.
  data jsonb not null,
  is_active boolean not null default true,
  last_seen_sync_id bigint not null references public.catalog_syncs (id),
  updated_at timestamptz not null default now()
);

comment on table public.cards is 'FC 27 Ultimate Team card catalog, one row per card version.';

create index cards_active_overall_idx on public.cards (is_active, overall desc);
create index cards_position_idx on public.cards (position);
create index cards_last_seen_sync_idx on public.cards (last_seen_sync_id);
create index cards_search_name_trgm_idx on public.cards using gin (search_name extensions.gin_trgm_ops);

-- Row-level security: writes only with the secret key (which bypasses RLS).
-- The catalog is public game data and readable by the app; reads are restricted
-- to signed-in, allow-listed users when authentication arrives (M4).
alter table public.cards enable row level security;
alter table public.catalog_syncs enable row level security;

create policy "cards are readable" on public.cards
  for select to anon, authenticated using (true);

create policy "catalog syncs are readable" on public.catalog_syncs
  for select to anon, authenticated using (true);
