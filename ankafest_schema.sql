-- ANKAFEST — Supabase şeması
-- Çalıştırma: Supabase > SQL Editor

create table public.ankafest_registrations (
  code text primary key,                       -- QR kodun içeriği, örn. ANK-7K2M9Q
  type text not null check (type in ('yarismaci','ziyaretci')),
  full_name text not null,
  email text not null,
  phone text,
  org text,
  team_name text,
  category text,
  project_name text,
  team_size int,
  project_summary text,
  visit_pref text,
  party_size int,
  kvkk boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ankafest_scans (
  id bigint generated always as identity primary key,
  code text not null references public.ankafest_registrations(code) on delete cascade,
  type text not null check (type in ('giris','cikis')),
  gate text,
  ts timestamptz not null default now()
);
create index on public.ankafest_scans (code, ts desc);

-- Tablolara yalnızca n8n'in service anahtarı erişir; herkese açık politika yok.
alter table public.ankafest_registrations enable row level security;
alter table public.ankafest_scans enable row level security;

-- Katılım özeti: ilk giriş, son çıkış, içeride mi, toplam kalış (dakika)
create or replace view public.ankafest_attendance as
with ordered as (
  select code, type, ts,
         lead(ts) over (partition by code order by ts) as next_ts
  from public.ankafest_scans
), stay as (
  select code,
         sum(extract(epoch from (coalesce(next_ts, now()) - ts)) / 60)::int as minutes
  from ordered
  where type = 'giris'
  group by code
)
select r.code, r.full_name, r.type,
       (select min(ts) from public.ankafest_scans s where s.code = r.code and s.type = 'giris') as first_in,
       (select max(ts) from public.ankafest_scans s where s.code = r.code and s.type = 'cikis') as last_out,
       coalesce((select s.type from public.ankafest_scans s where s.code = r.code order by s.ts desc limit 1), '') = 'giris' as inside,
       coalesce(st.minutes, 0) as total_minutes
from public.ankafest_registrations r
left join stay st on st.code = r.code;

revoke all on public.ankafest_attendance from anon, authenticated;
