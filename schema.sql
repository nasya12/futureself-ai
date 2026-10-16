-- FutureSelf AI — Fikir Panosu · Supabase şeması
-- Çalıştırma: Supabase > SQL Editor > yapıştır > Run

create extension if not exists pgcrypto;

-- 1) ideas: kullanıcının yazdığı ham fikir
create table public.ideas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,   -- e-postası doğrulanmış giriş yapan kullanıcı (e-posta bu tabloda tutulmaz)
  nickname   text not null check (char_length(nickname) between 2 and 30),
  idea_text  text not null check (char_length(idea_text) between 20 and 600),
  stage      text not null default 'fikir' check (stage in ('fikir','prototip','kullanici')),
  created_at timestamptz not null default now()
);

-- 2) idea_analyses: yapay zekânın bu fikir için ürettiği değerlendirme (fikirle 1'e 1)
create table public.idea_analyses (
  id           uuid primary key default gen_random_uuid(),
  idea_id      uuid not null unique references public.ideas(id) on delete cascade,
  category     text not null check (category in ('egitim','saglik','tarim','finans','yazilim','cevre','sosyal','diger')),
  summary      text not null,
  score        int  not null check (score between 1 and 10),
  score_reason text not null,
  risks        jsonb not null default '[]',
  next_steps   jsonb not null default '[]',
  ai_model     text,
  created_at   timestamptz not null default now()
);

create index ideas_created_idx on public.ideas (created_at desc);
create index ideas_user_idx    on public.ideas (user_id);
create index analyses_category_idx on public.idea_analyses (category);

-- Güvenlik: sayfa (anon anahtar) yalnızca OKUYABİLİR.
-- Yazma politikası yok; kayıtları sadece n8n'in service_role anahtarı ekler.
alter table public.ideas          enable row level security;
alter table public.idea_analyses  enable row level security;

create policy "ideas_herkes_okur"    on public.ideas         for select to anon, authenticated using (true);
create policy "analyses_herkes_okur" on public.idea_analyses for select to anon, authenticated using (true);
