-- Family Network Roles + OTP Verification
-- Adds role/verified to family_network and creates otp_codes table

alter table family_network
  add column if not exists role text not null default 'admin',
  add column if not exists verified boolean not null default false;

create table if not exists otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  code text not null,
  phone text not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);

-- Enable RLS on otp_codes
alter table otp_codes enable row level security;

drop policy if exists "Users can insert their own OTP codes" on otp_codes;
create policy "Users can insert their own OTP codes" on otp_codes
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can select their own OTP codes" on otp_codes;
create policy "Users can select their own OTP codes" on otp_codes
for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own OTP codes" on otp_codes;
create policy "Users can update their own OTP codes" on otp_codes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Hash OTP storage (bcrypt) and rate limiting
alter table otp_codes add column if not exists otp_hash text;
-- Rate limit tracking table
create table if not exists otp_rate_limits (
  phone text primary key,
  attempts int default 0,
  last_attempt timestamptz default now()
);
