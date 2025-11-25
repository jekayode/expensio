-- Add account_id to transactions table
alter table public.transactions 
add column if not exists account_id uuid references public.accounts(id);

-- Add account_id to project_expenses table
alter table public.project_expenses 
add column if not exists account_id uuid references public.accounts(id);
