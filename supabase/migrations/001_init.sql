-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- DOCUMENTS TABLE
-- Stores the latest state of the user's document for the "Shadow Doc" context ingestion.
create table documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Untitled',
  content jsonb, -- Full TipTap JSON structure
  plain_text text, -- Optimized for sending to LLM context window
  user_id uuid default auth.uid(), -- Optional if we add auth later
  last_active_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- AI GENERATIONS / LOGS TABLE
-- Stores every "thought" and "action" the AI takes. This is the "Intelligence Stream".
create table ai_generations (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade not null,
  
  -- Metadata for the UI "Cards"
  type text not null check (type in ('suggestion', 'analysis', 'citation', 'question', 'feedback')),
  intent text, -- 'literature_review', 'polishing', 'argumentation'
  reason text, -- 'Generated because you listed 3 key terms'
  
  -- The core content
  content text not null,
  
  -- Feedback loop
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'dismissed')),
  
  created_at timestamp with time zone default now()
);

-- RLS POLICIES (Simple for now, can be hardened later)
alter table documents enable row level security;
alter table ai_generations enable row level security;

-- Allow anonymous access for this local-first prototype style
-- In production, you'd restrict this to auth.uid()
create policy "Allow public access to documents"
on documents for all
using (true)
with check (true);

create policy "Allow public access to ai_generations"
on ai_generations for all
using (true)
with check (true);

-- Functions
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_documents_updated_at
before update on documents
for each row
execute procedure update_updated_at_column();
