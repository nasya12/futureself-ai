-- FutureSelf AI — Supabase şeması (MVP)
-- Çalıştırma: Supabase > SQL Editor

create extension if not exists "pgcrypto";

-- 1) Kullanıcı profili (formdan gelen ham veri)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  education text,
  skills jsonb not null default '[]',        -- [{"name":"Python","level":3}]
  interests text[] not null default '{}',
  experiences text[] not null default '{}',
  goals text,
  habits text,
  cv_text text,                              -- CV'den çıkarılan metin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Dijital ikiz (Profil Analiz Agent çıktısı)
create table public.twins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null default 1,
  strengths jsonb not null default '[]',
  skill_gaps jsonb not null default '[]',
  summary text,
  created_at timestamptz not null default now()
);

-- 3) Yol haritası (Kariyer Agent çıktısı)
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_paths jsonb not null default '[]',
  milestones jsonb not null default '[]',
  starts_on date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week int not null check (week between 1 and 12),
  title text not null,
  xp int not null default 50,
  done boolean not null default false,
  done_at timestamptz
);

-- 4) İlerleme olayları (XP, seri, rozet)
create table public.progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('task_done','badge','weekly_review','level_up')),
  xp_delta int not null default 0,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- 5) Mentor sohbet hafızası
create table public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','mentor')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Gizlilik: her kullanıcı yalnızca kendi satırlarını görür
do $$
declare t text;
begin
  foreach t in array array['profiles','twins','roadmaps','tasks','progress_events','mentor_messages']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Veri silme: auth.users satırı silinince tüm kayıtlar cascade ile silinir.

-- n8n'in tek çağrıyla kaydettiği fonksiyon (service key ile çağrılır)
create or replace function public.save_futureself_result(p_user_id uuid, p_result jsonb)
returns void language plpgsql security definer as $fn$
declare
  v_roadmap uuid;
  t jsonb;
begin
  insert into public.twins (user_id, version, strengths, skill_gaps, summary)
  values (
    p_user_id,
    coalesce((select max(version) + 1 from public.twins where user_id = p_user_id), 1),
    p_result->'twin'->'strengths',
    p_result->'skill_gaps',
    p_result->'twin'->>'summary'
  );

  update public.roadmaps set active = false where user_id = p_user_id and active;

  insert into public.roadmaps (user_id, career_paths, milestones)
  values (p_user_id, p_result->'career_paths', p_result->'milestones')
  returning id into v_roadmap;

  for t in select * from jsonb_array_elements(p_result->'weekly_tasks') loop
    insert into public.tasks (roadmap_id, user_id, week, title, xp)
    values (v_roadmap, p_user_id, (t->>'week')::int, t->>'title', (t->>'xp')::int);
  end loop;
end $fn$;

-- Toplam XP görünümü
create view public.user_xp as
  select user_id, coalesce(sum(xp_delta),0) as xp
  from public.progress_events group by user_id;
