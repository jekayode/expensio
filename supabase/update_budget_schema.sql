-- Add month column to budgets table
alter table public.budgets 
add column if not exists month date default date_trunc('month', now());
