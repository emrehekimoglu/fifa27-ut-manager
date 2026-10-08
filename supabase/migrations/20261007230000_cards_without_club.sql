-- Heroes belong to a league but to no club, so FUT.GG reports their club as null.

alter table public.cards
  alter column club_ea_id drop not null,
  alter column club_name drop not null;
