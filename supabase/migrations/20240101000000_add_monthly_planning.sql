-- Create monthly_plans table
create table if not exists public.monthly_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  month date not null, -- Stored as the first day of the month (e.g., '2023-12-01')
  expected_income numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, month)
);

-- Create categories table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  "group" text not null check ("group" in ('needs', 'wants', 'savings')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, name)
);

-- Enable RLS
alter table public.monthly_plans enable row level security;
alter table public.categories enable row level security;

-- Policies for monthly_plans
create policy "Users can view their own monthly plans"
  on public.monthly_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own monthly plans"
  on public.monthly_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own monthly plans"
  on public.monthly_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own monthly plans"
  on public.monthly_plans for delete
  using (auth.uid() = user_id);

-- Policies for categories
create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);
