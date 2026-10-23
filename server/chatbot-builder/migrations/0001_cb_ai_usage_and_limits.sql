-- BotCraft-only schema. Creates cb_* tables/functions only; no existing table is altered.
create table if not exists public.cb_ai_usage_log (
  id bigint generated always as identity primary key,
  request_id uuid,
  owner_id uuid,
  task text not null check (task in ('interview', 'extract', 'test', 'chat', 'voice')),
  key_slot smallint not null check (key_slot between 1 and 5),
  model_name text not null,
  tokens_in integer not null default 0 check (tokens_in >= 0),
  tokens_out integer not null default 0 check (tokens_out >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  status text not null check (status in ('success', 'error')),
  error text,
  created_at timestamptz not null default now()
);
create index if not exists cb_ai_usage_log_created_at_idx on public.cb_ai_usage_log (created_at desc);
create index if not exists cb_ai_usage_log_key_slot_created_at_idx on public.cb_ai_usage_log (key_slot, created_at desc);
create index if not exists cb_ai_usage_log_task_created_at_idx on public.cb_ai_usage_log (task, created_at desc);
create index if not exists cb_ai_usage_log_owner_created_at_idx on public.cb_ai_usage_log (owner_id, created_at desc);

create table if not exists public.cb_rate_counters (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);
create index if not exists cb_rate_counters_updated_at_idx on public.cb_rate_counters (updated_at);

create table if not exists public.cb_ai_reservations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  task text not null check (task in ('interview', 'extract', 'test', 'chat', 'voice')),
  status text not null default 'reserved' check (status in ('reserved', 'success', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists cb_ai_reservations_owner_created_at_idx on public.cb_ai_reservations (owner_id, created_at desc);

alter table public.cb_ai_usage_log enable row level security;
alter table public.cb_rate_counters enable row level security;
alter table public.cb_ai_reservations enable row level security;
revoke all on public.cb_ai_usage_log from anon, authenticated;
revoke all on public.cb_rate_counters from anon, authenticated;
revoke all on public.cb_ai_reservations from anon, authenticated;
grant all on public.cb_ai_usage_log to service_role;
grant all on public.cb_rate_counters to service_role;
grant all on public.cb_ai_reservations to service_role;
grant usage, select on sequence public.cb_ai_usage_log_id_seq to service_role;

create or replace function public.cb_take_rate_limit(
  p_bucket_key text, p_limit integer, p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_window_started_at timestamptz; v_request_count integer;
begin
  if p_bucket_key is null or length(p_bucket_key) < 1 or length(p_bucket_key) > 220
     or p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then return false; end if;
  insert into public.cb_rate_counters(bucket_key, window_started_at, request_count, updated_at)
    values (p_bucket_key, now(), 0, now()) on conflict (bucket_key) do nothing;
  select window_started_at, request_count into v_window_started_at, v_request_count
    from public.cb_rate_counters where bucket_key = p_bucket_key for update;
  if v_window_started_at <= now() - make_interval(secs => p_window_seconds) then
    update public.cb_rate_counters set window_started_at = now(), request_count = 1, updated_at = now()
      where bucket_key = p_bucket_key;
    return true;
  end if;
  if v_request_count >= p_limit then
    update public.cb_rate_counters set updated_at = now() where bucket_key = p_bucket_key;
    return false;
  end if;
  update public.cb_rate_counters set request_count = v_request_count + 1, updated_at = now()
    where bucket_key = p_bucket_key;
  return true;
end;
$$;

create or replace function public.cb_reserve_ai_request(
  p_owner_id uuid, p_task text, p_session_hash text, p_ip_hash text,
  p_ip_limit integer default 20, p_session_limit integer default 40,
  p_owner_daily_limit integer default 200, p_task_daily_limit integer default 80
) returns table(allowed boolean, reason text, reservation_id uuid)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_reservation_id uuid;
  v_day text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
  v_minute text := to_char(date_trunc('minute', now() at time zone 'UTC'), 'YYYYMMDDHH24MI');
begin
  if p_owner_id is null or p_task is null or p_task not in ('interview', 'extract', 'test', 'chat', 'voice')
     or p_session_hash is null or p_session_hash !~ '^[0-9a-f]{64}$'
     or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return query select false, 'invalid_task'::text, null::uuid; return;
  end if;
  if not public.cb_take_rate_limit('ip:' || p_ip_hash || ':' || v_minute, p_ip_limit, 60) then
    return query select false, 'ip_rate_limit'::text, null::uuid; return;
  end if;
  if not public.cb_take_rate_limit('session:' || p_session_hash, p_session_limit, 86400) then
    return query select false, 'session_limit'::text, null::uuid; return;
  end if;
  if not public.cb_take_rate_limit('owner:' || p_owner_id::text || ':' || v_day, p_owner_daily_limit, 86400) then
    return query select false, 'owner_daily_limit'::text, null::uuid; return;
  end if;
  if not public.cb_take_rate_limit('task:' || p_owner_id::text || ':' || p_task || ':' || v_day, p_task_daily_limit, 86400) then
    return query select false, 'task_daily_limit'::text, null::uuid; return;
  end if;
  insert into public.cb_ai_reservations(owner_id, task, status)
    values (p_owner_id, p_task, 'reserved') returning id into v_reservation_id;
  return query select true, 'allowed'::text, v_reservation_id;
end;
$$;

create or replace function public.cb_finalize_ai_request(p_reservation_id uuid, p_success boolean)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.cb_ai_reservations
    set status = case when p_success then 'success' else 'failed' end, completed_at = now()
    where id = p_reservation_id and status = 'reserved';
  return found;
end;
$$;

create or replace function public.cb_cleanup_old_rate_counters() returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_deleted integer;
begin
  delete from public.cb_rate_counters where updated_at < now() - interval '3 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.cb_take_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.cb_reserve_ai_request(uuid, text, text, text, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.cb_finalize_ai_request(uuid, boolean) from public, anon, authenticated;
revoke all on function public.cb_cleanup_old_rate_counters() from public, anon, authenticated;
grant execute on function public.cb_reserve_ai_request(uuid, text, text, text, integer, integer, integer, integer) to service_role;
grant execute on function public.cb_finalize_ai_request(uuid, boolean) to service_role;
grant execute on function public.cb_cleanup_old_rate_counters() to service_role;
