-- Family Health Network + Impact & Geographic Tracking
-- Run this in the Supabase SQL Editor.
--
-- Adds:
--   1. family_network table — strict 2-email access control + sharing prefs
--   2. geographic columns on profiles — country / region / city for the
--      impact geographic-distribution map
--   3. impact-snapshot columns on health_metrics — whether a reading was a
--      "screening" and whether it flagged a potential case, so the dashboard
--      can compute real-world impact metrics over time.

-- ── 1. Family Network ─────────────────────────────────────────────────────
create table if not exists family_network (
  id                             uuid primary key default gen_random_uuid(),
  user_id                        uuid not null references auth.users(id) on delete cascade,

  -- Strict access control: exactly two emails (patient + one family member).
  patient_email                  text not null,
  family_email                   text not null,

  -- Optional mobile numbers for WhatsApp / SMS delivery.
  patient_phone                  text,
  family_phone                   text,

  -- Sharing toggles.
  share_weekly_summaries         boolean not null default true,
  share_alert_notifications      boolean not null default true,
  share_medication_reminders     boolean not null default true,

  -- Delivery-method toggles.
  send_via_email                 boolean not null default true,
  send_via_whatsapp              boolean not null default false,

  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now(),

  constraint uq_family_network_user unique (user_id)
);

-- ── 2. Geographic columns on profiles ──────────────────────────────────────
alter table profiles
  add column if not exists country text,
  add column if not exists region  text,
  add column if not exists city    text;

-- ── 3. Impact-snapshot columns on health_metrics ──────────────────────────
alter table health_metrics
  add column if not exists is_screening            boolean not null default false,
  add column if not exists potential_case_detected boolean not null default false;

-- ── 4. Indexes ────────────────────────────────────────────────────────────
create index if not exists idx_family_network_user on family_network (user_id);
create index if not exists idx_healthmetrics_screening on health_metrics (user_id, is_screening, recorded_at desc);

-- ── 5. Auto-update updated_at ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_family_network_updated on family_network;
create trigger trg_family_network_updated
  before update on family_network
  for each row execute function set_updated_at();

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated
  before update on profiles
  for each row execute function set_updated_at();