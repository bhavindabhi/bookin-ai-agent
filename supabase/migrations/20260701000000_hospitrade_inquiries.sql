-- Hospitrade AI: trade inquiries table
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  customer_name text not null,
  business_name text,
  phone text,
  email text,
  products_requested text,
  quantity_notes text,
  urgency_note text,
  status text default 'new' check (status in ('new', 'contacted', 'quoted', 'ordered', 'closed')),
  source text default 'ai_voice_agent',
  notes text
);

alter table public.inquiries enable row level security;

-- Allow service role full access
create policy "Service role full access" on public.inquiries
  for all using (true);
