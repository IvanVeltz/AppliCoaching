-- Types de séance : un enum évite les fautes de frappe ("fractionné" / "Fractionne"…)
create type session_type as enum (
  'footing', 'fractionne', 'seuil', 'sortie_longue',
  'cotes', 'recuperation', 'course'
);

-- Les athlètes
create table athletes (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references auth.users(id) on delete cascade
             default auth.uid(),
  user_id    uuid unique references auth.users(id) on delete set null,
  name       text not null,
  email      text,
  created_at timestamptz not null default now()
);

-- Les séances
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade
              default auth.uid(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  date        date not null,
  type        session_type not null,
  distance_km numeric(5,1) check (distance_km >= 0),
  title       text not null,
  details     text,
  created_at  timestamptz not null default now()
);

create index on sessions (athlete_id, date);

-- Sécurité (Row Level Security)
alter table athletes enable row level security;
alter table sessions enable row level security;

create policy "coach gère ses athlètes" on athletes
  for all using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "athlète voit sa fiche" on athletes
  for select using (user_id = auth.uid());

create policy "coach gère ses séances" on sessions
  for all using (coach_id = auth.uid())
  with check (
    coach_id = auth.uid()
    and athlete_id in (select id from athletes where coach_id = auth.uid())
  );

create policy "athlète lit ses séances" on sessions
  for select using (
    athlete_id in (select id from athletes where user_id = auth.uid())
  );

create function claim_athlete() returns void
language sql security definer set search_path = public as $$
  update athletes
  set user_id = auth.uid()
  where user_id is null
    and lower(email) = lower(auth.jwt() ->> 'email');
$$;

revoke execute on function claim_athlete() from public, anon;
grant execute on function claim_athlete() to authenticated;

-- Vrai quand l'athlète a choisi son propre mot de passe
alter table athletes add column password_set boolean not null default false;

-- L'athlète n'a pas le droit de modifier la table : cette fonction le fait pour lui,
-- uniquement sur sa propre fiche
create function mark_password_set() returns void
language sql security definer set search_path = public as $$
  update athletes set password_set = true where user_id = auth.uid();
$$;

revoke execute on function mark_password_set() from public, anon;
grant execute on function mark_password_set() to authenticated;

-- Optionnel : les athlètes déjà liés à un compte (tes tests) ne seront pas forcés
update athletes set password_set = true where user_id is not null;

-- Les allures de l'athlète, en secondes par km : {"ef": 360, "seuil": 270, ...}
alter table athletes add column paces jsonb not null default '{}'::jsonb;

-- Les blocs d'une séance (on s'en servira à l'étape suivante)
alter table sessions add column blocks jsonb not null default '[]'::jsonb;