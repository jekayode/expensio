-- Add name column to budgets table
alter table public.budgets 
add column if not exists name text;

-- Optional: Migrate existing data to set name = category for old records
update public.budgets 
set name = category 
where name is null;
