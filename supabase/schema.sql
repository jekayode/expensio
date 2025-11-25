-- Create accounts table
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  type text not null, -- 'savings', 'current', 'investment', 'mobile money', 'cash'
  balance numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  description text,
  status text default 'active', -- 'active', 'completed', 'archived'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create project_expenses table
create table if not exists public.project_expenses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  amount numeric not null,
  description text not null,
  category text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.accounts enable row level security;
alter table public.projects enable row level security;
alter table public.project_expenses enable row level security;

-- Create policies
create policy "Users can view their own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

create policy "Users can view their own project expenses"
  on public.project_expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own project expenses"
  on public.project_expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own project expenses"
  on public.project_expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own project expenses"
  on public.project_expenses for delete
  using (auth.uid() = user_id);
