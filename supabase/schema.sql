-- ==============================================================================
-- SpotSiNi - Supabase Database Schema & OAuth Profile Synchronization
-- ==============================================================================
-- Jalankan skrip SQL ini di Supabase Dashboard -> SQL Editor
-- Proyek: SpotSiNi (ebcrfgacipzkonybrzbh)
-- ==============================================================================

-- 1. Buat Tabel public.profiles yang berelasi dengan auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'owner', 'admin')),
  points integer default 0,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Aktifkan Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Hapus policy lama jika ada untuk mencegah duplikasi
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- 3. Kebijakan RLS (Row Level Security Policies)
-- Semua orang (termasuk anonim & customer) bisa melihat profil pengguna/pemilik usaha
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- Pengguna yang login dapat memasukkan profil mereka sendiri
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Pengguna hanya dapat memperbarui profil milik mereka sendiri
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 4. Fungsi otomatis untuk sinkronisasi dari auth.users ke public.profiles saat OAuth / Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Warga SpotSiNi'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    ),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger yang memicu handle_new_user setiap kali user baru terdaftar di auth.users (Google OAuth / Email)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Tambahkan ke publikasi Supabase Realtime agar perubahan profil dapat didengarkan secara real-time
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
