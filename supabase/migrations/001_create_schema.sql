-- 001_create_schema.sql
-- Initial schema for PediaSnap
-- Creates core tables, enums, constraints and RLS policies.
-- WARNING: This migration assumes Supabase Auth is enabled and `auth.users` exists.

begin;

-- Enums
CREATE TYPE app_role AS ENUM ('super_admin', 'clinic_admin', 'provider', 'nurse', 'parent');
CREATE TYPE immunization_status AS ENUM ('pending_review', 'reviewed', 'evaluated');
CREATE TYPE ai_provider AS ENUM ('openai', 'gemini', 'anthropic');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');

-- profiles table (extended)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  password_set boolean default false,
  force_password_change boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- user_roles
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  clinic_id uuid null references public.clinics(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- clinics
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  stripe_customer_id text,
  current_plan_id uuid references public.subscription_plans(id),
  plan_start_date date,
  plan_end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- subscription_plans
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_product_id text,
  max_patients int default 0,
  max_staff int default 0,
  price_per_month numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- clinic_subscriptions
create table if not exists public.clinic_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  stripe_subscription_id text,
  status subscription_status default 'active',
  start_date timestamptz default now(),
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- patients
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  parent_user_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- immunization_records
create table if not exists public.immunization_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  vaccine_name_foreign text,
  vaccine_name_us_cvx text,
  date_administered date,
  document_id uuid references public.documents(id) on delete set null,
  extracted_data jsonb,
  status immunization_status default 'pending_review',
  ice_evaluation_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- auth_security_settings (singleton)
create table if not exists public.auth_security_settings (
  singleton_key text primary key default 'global_settings',
  lockout_threshold int default 5,
  lockout_window_minutes int default 15,
  lockout_duration_minutes int default 30,
  session_timeout_minutes int default 120,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

-- auth_security_events
create table if not exists public.auth_security_events (
  id uuid primary key default gen_random_uuid(),
  email text,
  event_type text,
  reason text,
  optional_user uuid references public.profiles(id),
  ip_address inet,
  created_at timestamptz default now()
);

-- mfa_settings
create table if not exists public.mfa_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  totp_enabled boolean default false,
  secret text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- api_key_configs
create table if not exists public.api_key_configs (
  id uuid primary key default gen_random_uuid(),
  provider ai_provider not null,
  key_value text not null,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id)
);

-- Indexes
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_patients_clinic_id on public.patients(clinic_id);
create index if not exists idx_documents_patient_id on public.documents(patient_id);
create index if not exists idx_immunization_patient on public.immunization_records(patient_id);

-- Row-level security: enable for application tables
alter table public.clinics enable row level security;
alter table public.patients enable row level security;
alter table public.documents enable row level security;
alter table public.immunization_records enable row level security;
alter table public.user_roles enable row level security;
alter table public.api_key_configs enable row level security;
alter table public.clinic_subscriptions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.audit_logs enable row level security;
alter table public.auth_security_settings enable row level security;
alter table public.auth_security_events enable row level security;

-- Helper policy function: check role membership
create or replace function public.has_role(p_user uuid, p_role text, p_clinic uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_user
      and ur.role = p_role
      and (ur.clinic_id is null or ur.clinic_id = p_clinic)
  );
$$;

-- Clinics policies
create policy "super_admin_read_clinics" on public.clinics
  for select using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  ));

create policy "clinic_members_read_own" on public.clinics
  for select using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.clinic_id = clinics.id
  ));

create policy "super_admin_full" on public.clinics
  for all using (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  ) with check (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  );

-- Patients policies
create policy "patients_select_clinic_staff_or_parent" on public.patients
  for select using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider','nurse') and ur.clinic_id = patients.clinic_id
    )
    or patients.parent_user_id = auth.uid()
    or exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'
    )
  );

create policy "patients_insert_by_clinic_staff" on public.patients
  for insert with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider') and ur.clinic_id = new.clinic_id
    )
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  );

create policy "patients_update_delete_by_clinic_admin_or_super" on public.patients
  for update, delete using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('clinic_admin') and ur.clinic_id = patients.clinic_id
    )
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  );

-- Documents policies (private storage metadata)
create policy "documents_select_clinic_staff_or_parent" on public.documents
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = documents.patient_id
      and (
        exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider','nurse') and ur.clinic_id = p.clinic_id
        )
        or p.parent_user_id = auth.uid()
        or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
      )
    )
  );

create policy "documents_insert_by_clinic_staff" on public.documents
  for insert with check (
    exists (
      select 1 from public.patients p
      where p.id = new.patient_id
      and exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider') and ur.clinic_id = p.clinic_id
      )
    )
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  );

-- Immunization records policies
create policy "immunization_select_clinic_staff_or_parent" on public.immunization_records
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = immunization_records.patient_id
      and (
        exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider','nurse') and ur.clinic_id = p.clinic_id
        )
        or p.parent_user_id = auth.uid()
        or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
      )
    )
  );

create policy "immunization_insert_update_delete_by_clinic_staff" on public.immunization_records
  for insert, update, delete using (
    exists (
      select 1 from public.patients p
      where p.id = immunization_records.patient_id
      and exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider','nurse') and ur.clinic_id = p.clinic_id
      )
    )
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  ) with check (
    exists (
      select 1 from public.patients p
      where p.id = new.patient_id
      and exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid() and ur.role in ('clinic_admin','provider','nurse') and ur.clinic_id = p.clinic_id
      )
    )
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  );

-- api_key_configs: only super_admin can read/write
create policy "api_keys_super_admin" on public.api_key_configs
  for all using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'))
  with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'));

-- subscription plans: readable by clinic admins and super admin
create policy "subscription_plans_public_select" on public.subscription_plans
  for select using (
    true
  );

-- clinic_subscriptions: clinic admins and super_admin
create policy "clinic_subscriptions_select" on public.clinic_subscriptions
  for select using (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.clinic_id = clinic_subscriptions.clinic_id)
  );

-- audit_logs: only super_admin read/write
create policy "audit_logs_super_admin" on public.audit_logs
  for all using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'))
  with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'));

-- auth_security_settings: super_admin read/write
create policy "auth_security_settings_super_admin" on public.auth_security_settings
  for all using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'))
  with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'));

-- auth_security_events: write from anon (events collection) allowed (to record failed attempts), but selects restricted
create policy "auth_security_events_insert" on public.auth_security_events
  for insert with check (true);

create policy "auth_security_events_select_super_admin_or_self" on public.auth_security_events
  for select using (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  );

commit;
