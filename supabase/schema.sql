create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  workspace_id text not null,
  name text not null,
  domain text not null,
  platform text not null check (platform in ('shopify', 'webflow', 'woocommerce', 'salesforce', 'custom')),
  public_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  hypothesis text not null default '',
  page_pattern text not null,
  traffic_split integer not null default 100,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused')),
  experiment_type text not null default 'visual' check (experiment_type in ('visual', 'custom_code', 'popup', 'recommendation')),
  primary_metric text not null default 'conversion' check (primary_metric in ('page_view', 'click', 'conversion')),
  editor_mode text not null default 'visual' check (editor_mode in ('visual', 'custom_code')),
  custom_code text,
  audience_rules jsonb not null default '[]'::jsonb,
  targeting_rules jsonb,
  recommendation_config jsonb,
  created_at timestamptz not null default now()
);

create table if not exists variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  name text not null,
  key text not null,
  allocation integer not null,
  is_control boolean not null default false,
  changes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (experiment_id, key)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  anonymous_id text not null,
  session_id text,
  experiment_id uuid not null references experiments(id) on delete cascade,
  variant_key text not null,
  event_type text not null check (
    event_type in (
      'session_start',
      'page_view',
      'page_exit',
      'click',
      'cta_click',
      'outbound_click',
      'rage_click',
      'dead_click',
      'conversion',
      'scroll_depth',
      'time_on_page',
      'form_start',
      'field_focus',
      'field_blur',
      'form_submit',
      'form_error',
      'form_abandon',
      'product_view',
      'add_to_cart',
      'remove_from_cart',
      'checkout_start',
      'purchase',
      'recommendation_impression',
      'recommendation_click',
      'video_start',
      'video_progress',
      'video_complete',
      'js_error',
      'experiment_impression',
      'performance'
    )
  ),
  pathname text not null default '/',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists session_recordings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  anonymous_id text not null,
  session_id text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  chunk_index integer not null,
  frame_count integer not null default 0,
  frames jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, session_id, chunk_index)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'scale')),
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_experiments_project on experiments(project_id);
create index if not exists idx_variants_experiment on variants(experiment_id);
create index if not exists idx_events_experiment_created on events(experiment_id, created_at desc);
create index if not exists idx_events_project_created on events(project_id, created_at desc);
create index if not exists idx_events_variant_type on events(variant_key, event_type);
create index if not exists idx_events_session on events(session_id);
create index if not exists idx_session_recordings_project_session on session_recordings(project_id, session_id, chunk_index);

alter table users enable row level security;
alter table projects enable row level security;
alter table experiments enable row level security;
alter table variants enable row level security;
alter table events enable row level security;
alter table session_recordings enable row level security;
alter table subscriptions enable row level security;

create policy "users can read own profile" on users
for select using (auth.uid() = id);

create policy "users can manage own profile" on users
for all using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can manage own projects" on projects
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "users can manage experiments for owned projects" on experiments
for all using (
  exists (
    select 1 from projects
    where projects.id = experiments.project_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from projects
    where projects.id = experiments.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "users can manage variants for owned experiments" on variants
for all using (
  exists (
    select 1
    from experiments
    join projects on projects.id = experiments.project_id
    where experiments.id = variants.experiment_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from experiments
    join projects on projects.id = experiments.project_id
    where experiments.id = variants.experiment_id
      and projects.owner_id = auth.uid()
  )
);

create policy "users can read events for owned projects" on events
for select using (
  exists (
    select 1 from projects
    where projects.id = events.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "service role can insert events" on events
for insert with check (auth.role() = 'service_role');

create policy "users can read recordings for owned projects" on session_recordings
for select using (
  exists (
    select 1 from projects
    where projects.id = session_recordings.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "service role can insert recordings" on session_recordings
for insert with check (auth.role() = 'service_role');

create policy "users can manage own subscriptions" on subscriptions
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());
