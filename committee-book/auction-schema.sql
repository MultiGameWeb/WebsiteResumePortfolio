-- Auction Chit Manager — Supabase schema + protected auction RPCs.
-- Apply in the Supabase SQL editor after creating a Supabase project.
-- Do not place the service_role key in browser code.
-- Have a qualified local professional review the product and rules before a live chit is operated.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('platform_admin','user')),
  created_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.create_profile_for_new_auth_user();

create table if not exists public.chits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  pot_paise bigint not null check (pot_paise > 0),
  member_count integer not null check (member_count >= 2),
  starting_floor_paise bigint not null check (starting_floor_paise > 0 and starting_floor_paise <= pot_paise),
  max_discount_pct numeric(5,2) not null default 40 check (max_discount_pct >= 0 and max_discount_pct <= 100),
  commission_pct numeric(5,2) not null default 5 check (commission_pct >= 0 and commission_pct <= 100),
  dividend_rule text not null default 'all_members' check (dividend_rule in ('all_members','non_winners')),
  start_date date not null,
  auction_start_day integer not null default 1 check (auction_start_day between 1 and 31),
  auction_end_day integer not null default 3 check (auction_end_day between 1 and 31 and auction_end_day >= auction_start_day),
  due_day integer not null default 10 check (due_day between 1 and 31),
  late_fine_per_day_paise bigint not null default 0 check (late_fine_per_day_paise >= 0),
  upi_id text,
  rules_html text not null default '',
  status text not null default 'draft' check (status in ('draft','active','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  kyc_doc_path text,
  nominee_name text,
  status text not null default 'active' check (status in ('active','winner','removed')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, chit_id)
);
create index if not exists members_chit_status_idx on public.members(chit_id, status);
create index if not exists members_auth_user_idx on public.members(auth_user_id);

create table if not exists public.monthly_cycles (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  month_no integer not null check (month_no >= 1),
  status text not null default 'upcoming' check (status in ('upcoming','open','completed','cancelled')),
  auction_starts_at timestamptz not null,
  auction_ends_at timestamptz not null,
  due_date date not null,
  pot_paise bigint not null check (pot_paise > 0),
  base_contribution_paise bigint not null check (base_contribution_paise >= 0),
  floor_price_paise bigint not null check (floor_price_paise > 0),
  member_count integer not null check (member_count >= 2),
  max_discount_pct numeric(5,2) not null check (max_discount_pct between 0 and 100),
  commission_pct numeric(5,2) not null check (commission_pct between 0 and 100),
  dividend_rule text not null check (dividend_rule in ('all_members','non_winners')),
  late_fine_per_day_paise bigint not null default 0 check (late_fine_per_day_paise >= 0),
  winner_member_id uuid,
  winning_bid_paise bigint,
  prize_paise bigint,
  discount_paise bigint,
  commission_paise bigint,
  dividend_pool_paise bigint,
  dividend_per_head_paise bigint,
  rounding_leftover_paise bigint,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (chit_id, month_no),
  unique (id, chit_id),
  foreign key (winner_member_id, chit_id) references public.members(id, chit_id) on delete restrict,
  check (auction_ends_at > auction_starts_at)
);
create index if not exists monthly_cycles_chit_status_idx on public.monthly_cycles(chit_id, status);
create index if not exists monthly_cycles_end_idx on public.monthly_cycles(status, auction_ends_at);

create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  cycle_id uuid not null,
  member_id uuid not null,
  bidder_name_snapshot text not null,
  amount_paise bigint not null check (amount_paise > 0),
  status text not null default 'submitted' check (status in ('submitted','approved','rejected','winner')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  unique (cycle_id, member_id),
  foreign key (cycle_id, chit_id) references public.monthly_cycles(id, chit_id) on delete restrict,
  foreign key (member_id, chit_id) references public.members(id, chit_id) on delete restrict
);
create index if not exists auction_bids_cycle_rank_idx on public.auction_bids(cycle_id, status, amount_paise, created_at);

-- Payments are an append-only ledger: a correction is a new reversal entry.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  cycle_id uuid not null,
  member_id uuid not null,
  entry_type text not null default 'payment' check (entry_type in ('payment','reversal')),
  amount_paise bigint not null check (amount_paise > 0),
  amount_due_snapshot_paise bigint not null default 0 check (amount_due_snapshot_paise >= 0),
  mode text not null default 'upi' check (mode in ('upi','cash','bank','other')),
  status text not null default 'reported' check (status in ('reported','confirmed','rejected')),
  screenshot_path text,
  original_payment_id uuid references public.payments(id) on delete restrict,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  confirmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  foreign key (cycle_id, chit_id) references public.monthly_cycles(id, chit_id) on delete restrict,
  foreign key (member_id, chit_id) references public.members(id, chit_id) on delete restrict,
  check ((entry_type = 'payment' and original_payment_id is null) or entry_type = 'reversal')
);
create index if not exists payments_cycle_member_idx on public.payments(cycle_id, member_id, created_at);

create table if not exists public.dividend_history (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  cycle_id uuid not null,
  member_id uuid not null,
  amount_paise bigint not null check (amount_paise >= 0),
  created_at timestamptz not null default now(),
  foreign key (cycle_id, chit_id) references public.monthly_cycles(id, chit_id) on delete restrict,
  foreign key (member_id, chit_id) references public.members(id, chit_id) on delete restrict,
  unique (cycle_id, member_id)
);
create index if not exists dividend_history_member_idx on public.dividend_history(chit_id, member_id, created_at);

create table if not exists public.payment_audit (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  payment_id uuid not null references public.payments(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.can_manage_chit(p_chit_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.chits c where c.id = p_chit_id and c.owner_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'platform_admin');
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'platform_admin');
$;

create or replace function public.can_manage_chit_document(p_name text)
returns boolean language sql stable security definer set search_path = public as $
  select exists (select 1 from public.chits c where c.id::text = split_part(p_name, '/', 1) and c.owner_id = auth.uid())
      or public.is_platform_admin();
$;

create or replace function public.is_chit_participant(p_chit_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_manage_chit(p_chit_id)
      or exists (select 1 from public.members m where m.chit_id = p_chit_id and m.auth_user_id = auth.uid() and m.status <> 'removed');
$$;

create or replace function public.is_own_chit_document(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.members m
    where m.chit_id::text = split_part(p_name, '/', 1)
      and m.id::text = split_part(p_name, '/', 2)
      and m.auth_user_id = auth.uid()
      and m.status <> 'removed'
  );
$$;

alter table public.profiles enable row level security;
alter table public.chits enable row level security;
alter table public.members enable row level security;
alter table public.monthly_cycles enable row level security;
alter table public.auction_bids enable row level security;
alter table public.payments enable row level security;
alter table public.dividend_history enable row level security;
alter table public.payment_audit enable row level security;

drop policy if exists "profiles_select_self_or_platform_admin" on public.profiles;
create policy "profiles_select_self_or_platform_admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "chits_select_participants" on public.chits;
create policy "chits_select_participants" on public.chits for select to authenticated
using (owner_id = auth.uid() or public.is_chit_participant(id));

drop policy if exists "chits_insert_owner" on public.chits;
create policy "chits_insert_owner" on public.chits for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "chits_update_owner_or_platform_admin" on public.chits;
create policy "chits_update_owner_or_platform_admin" on public.chits for update to authenticated
using (public.can_manage_chit(id)) with check (public.can_manage_chit(id));

drop policy if exists "members_select_owner_or_self" on public.members;
create policy "members_select_owner_or_self" on public.members for select to authenticated
using (public.can_manage_chit(chit_id) or auth_user_id = auth.uid());

drop policy if exists "members_insert_owner" on public.members;
create policy "members_insert_owner" on public.members for insert to authenticated
with check (public.can_manage_chit(chit_id));

drop policy if exists "members_update_owner" on public.members;
create policy "members_update_owner" on public.members for update to authenticated
using (public.can_manage_chit(chit_id)) with check (public.can_manage_chit(chit_id));

drop policy if exists "cycles_select_participants" on public.monthly_cycles;
create policy "cycles_select_participants" on public.monthly_cycles for select to authenticated
using (public.is_chit_participant(chit_id));

drop policy if exists "bids_select_chit_participants" on public.auction_bids;
create policy "bids_select_chit_participants" on public.auction_bids for select to authenticated
using (public.is_chit_participant(chit_id));

drop policy if exists "payments_select_owner_or_self" on public.payments;
create policy "payments_select_owner_or_self" on public.payments for select to authenticated
using (public.can_manage_chit(chit_id) or exists (select 1 from public.members m where m.id = member_id and m.auth_user_id = auth.uid()));

drop policy if exists "dividend_select_owner_or_self" on public.dividend_history;
create policy "dividend_select_owner_or_self" on public.dividend_history for select to authenticated
using (public.can_manage_chit(chit_id) or exists (select 1 from public.members m where m.id = member_id and m.auth_user_id = auth.uid()));

drop policy if exists "payment_audit_select_owner" on public.payment_audit;
create policy "payment_audit_select_owner" on public.payment_audit for select to authenticated
using (public.can_manage_chit(chit_id));

-- Create the private bucket for KYC documents and payment screenshots. Paths use chit UUID/member UUID/file name.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chit-private-docs','chit-private-docs',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

drop policy if exists "chit_docs_select_owner_or_self" on storage.objects;
create policy "chit_docs_select_owner_or_self" on storage.objects for select to authenticated
using (bucket_id = 'chit-private-docs' and (
  public.can_manage_chit_document(name)
  or public.is_own_chit_document(name)
));

drop policy if exists "chit_docs_insert_owner_or_self" on storage.objects;
create policy "chit_docs_insert_owner_or_self" on storage.objects for insert to authenticated
with check (bucket_id = 'chit-private-docs' and (
  public.can_manage_chit_document(name)
  or public.is_own_chit_document(name)
));

drop policy if exists "chit_docs_update_owner" on storage.objects;
create policy "chit_docs_update_owner" on storage.objects for update to authenticated
using (bucket_id = 'chit-private-docs' and public.can_manage_chit_document(name))
with check (bucket_id = 'chit-private-docs' and public.can_manage_chit_document(name));

drop policy if exists "chit_docs_delete_owner" on storage.objects;
create policy "chit_docs_delete_owner" on storage.objects for delete to authenticated
using (bucket_id = 'chit-private-docs' and public.can_manage_chit_document(name));

create or replace function public.initialize_chit_cycles(p_chit_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_chit public.chits%rowtype;
  v_month integer;
  v_month_start date;
  v_last_day integer;
  v_start_date date;
  v_end_date date;
  v_due_date date;
  v_remaining integer;
  v_floor bigint;
  v_inserted integer := 0;
begin
  if not public.can_manage_chit(p_chit_id) then raise exception 'Not allowed to initialize cycles for this chit'; end if;
  select * into v_chit from public.chits where id = p_chit_id for update;
  if not found then raise exception 'Chit not found'; end if;
  if exists (select 1 from public.monthly_cycles where chit_id = p_chit_id) then
    raise exception 'Cycles already initialized; do not recreate financial history';
  end if;
  if (select count(*) from public.members where chit_id=p_chit_id and status <> 'removed') <> v_chit.member_count then
    raise exception 'Add exactly the configured member count before initializing monthly cycles';
  end if;
  for v_month in 1..v_chit.member_count loop
    v_month_start := (date_trunc('month', v_chit.start_date::timestamp) + ((v_month - 1) * interval '1 month'))::date;
    v_last_day := extract(day from (v_month_start + interval '1 month - 1 day'))::integer;
    v_start_date := v_month_start + least(v_chit.auction_start_day, v_last_day) - 1;
    v_end_date := v_month_start + least(v_chit.auction_end_day, v_last_day) - 1;
    v_due_date := v_month_start + least(v_chit.due_day, v_last_day) - 1;
    v_remaining := v_chit.member_count - v_month + 1;
    v_floor := greatest(v_chit.starting_floor_paise,
      v_chit.pot_paise - floor(v_chit.pot_paise::numeric * v_chit.max_discount_pct / 100 * v_remaining / v_chit.member_count)::bigint);
    insert into public.monthly_cycles (
      chit_id, month_no, status, auction_starts_at, auction_ends_at, due_date,
      pot_paise, base_contribution_paise, floor_price_paise, member_count,
      max_discount_pct, commission_pct, dividend_rule, late_fine_per_day_paise
    ) values (
      p_chit_id, v_month,
      case when (v_start_date::timestamp at time zone 'Asia/Kolkata') > now() then 'upcoming' else 'open' end,
      (v_start_date::timestamp at time zone 'Asia/Kolkata'),
      ((v_end_date::timestamp + time '23:59:59') at time zone 'Asia/Kolkata'),
      v_due_date, v_chit.pot_paise,
      floor(v_chit.pot_paise::numeric / v_chit.member_count)::bigint,
      v_floor, v_chit.member_count, v_chit.max_discount_pct, v_chit.commission_pct,
      v_chit.dividend_rule, v_chit.late_fine_per_day_paise
    );
    v_inserted := v_inserted + 1;
  end loop;
  return v_inserted;
end;
$$;

-- Call after an organizer changes editable chit settings. Closed cycles remain immutable.
create or replace function public.sync_open_auction_cycles(p_chit_id uuid)
returns integer language plpgsql security definer set search_path = public as $
declare
  v_chit public.chits%rowtype;
  v_cycle public.monthly_cycles%rowtype;
  v_month_start date;
  v_last_day integer;
  v_start_date date;
  v_end_date date;
  v_due_date date;
  v_remaining integer;
  v_floor bigint;
  v_updated integer := 0;
begin
  if not public.can_manage_chit(p_chit_id) then raise exception 'Only this chit organizer can sync cycle settings'; end if;
  select * into v_chit from public.chits where id=p_chit_id for update;
  if not found then raise exception 'Chit not found'; end if;
  for v_cycle in select * from public.monthly_cycles where chit_id=p_chit_id and status in ('open','upcoming') for update loop
    v_month_start := (date_trunc('month', v_chit.start_date::timestamp) + ((v_cycle.month_no - 1) * interval '1 month'))::date;
    v_last_day := extract(day from (v_month_start + interval '1 month - 1 day'))::integer;
    v_start_date := v_month_start + least(v_chit.auction_start_day,v_last_day) - 1;
    v_end_date := v_month_start + least(v_chit.auction_end_day,v_last_day) - 1;
    v_due_date := v_month_start + least(v_chit.due_day,v_last_day) - 1;
    v_remaining := v_chit.member_count - v_cycle.month_no + 1;
    v_floor := greatest(v_chit.starting_floor_paise,
      v_chit.pot_paise - floor(v_chit.pot_paise::numeric * v_chit.max_discount_pct / 100 * greatest(1,v_remaining) / v_chit.member_count)::bigint);
    update public.monthly_cycles set
      status = case when (v_start_date::timestamp at time zone 'Asia/Kolkata') > now() then 'upcoming' else 'open' end,
      auction_starts_at = (v_start_date::timestamp at time zone 'Asia/Kolkata'),
      auction_ends_at = ((v_end_date::timestamp + time '23:59:59') at time zone 'Asia/Kolkata'),
      due_date = v_due_date,
      pot_paise = v_chit.pot_paise,
      base_contribution_paise = floor(v_chit.pot_paise::numeric / v_chit.member_count)::bigint,
      floor_price_paise = v_floor,
      member_count = v_chit.member_count,
      max_discount_pct = v_chit.max_discount_pct,
      commission_pct = v_chit.commission_pct,
      dividend_rule = v_chit.dividend_rule,
      late_fine_per_day_paise = v_chit.late_fine_per_day_paise
    where id=v_cycle.id;
    v_updated := v_updated + 1;
  end loop;
  return v_updated;
end;
$;

create or replace function public.place_auction_bid(p_cycle_id uuid, p_amount_paise bigint)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.monthly_cycles%rowtype;
  v_member public.members%rowtype;
  v_bid_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  select mc.* into v_cycle
  from public.monthly_cycles mc
  where mc.id = p_cycle_id
  for update;
  if not found then raise exception 'Auction cycle not found'; end if;
  if v_cycle.status <> 'open' then raise exception 'Auction is not open'; end if;
  if now() < v_cycle.auction_starts_at or now() > v_cycle.auction_ends_at then raise exception 'Auction window is closed'; end if;
  select m.* into v_member from public.members m
  where m.chit_id = v_cycle.chit_id and m.auth_user_id = auth.uid()
  for update;
  if not found or v_member.status = 'removed' then raise exception 'No active membership found for this chit'; end if;
  if exists (select 1 from public.monthly_cycles oldc where oldc.chit_id = v_cycle.chit_id and oldc.status = 'completed' and oldc.winner_member_id = v_member.id) then
    raise exception 'A previous prize winner cannot bid again';
  end if;
  if p_amount_paise < v_cycle.floor_price_paise then raise exception 'Bid is below the floor price'; end if;
  if p_amount_paise > v_cycle.pot_paise then raise exception 'Bid cannot exceed the pot'; end if;
  insert into public.auction_bids (chit_id, cycle_id, member_id, bidder_name_snapshot, amount_paise, status)
  values (v_cycle.chit_id, v_cycle.id, v_member.id, v_member.name, p_amount_paise, 'submitted')
  on conflict (cycle_id, member_id) do update
    set bidder_name_snapshot = excluded.bidder_name_snapshot,
        amount_paise = excluded.amount_paise,
        status = 'submitted',
        created_at = now(),
        approved_at = null,
        approved_by = null
    where public.auction_bids.status <> 'winner'
  returning id into v_bid_id;
  if v_bid_id is null then raise exception 'Bid is already finalized'; end if;
  return v_bid_id;
end;
$$;

create or replace function public.approve_auction_bid(p_bid_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_bid public.auction_bids%rowtype;
  v_cycle public.monthly_cycles%rowtype;
begin
  select * into v_bid from public.auction_bids where id = p_bid_id for update;
  if not found then raise exception 'Bid not found'; end if;
  if not public.can_manage_chit(v_bid.chit_id) then raise exception 'Only this chit organizer can approve bids'; end if;
  select * into v_cycle from public.monthly_cycles where id = v_bid.cycle_id;
  if v_cycle.status <> 'open' then raise exception 'Auction is already completed'; end if;
  if v_bid.status not in ('submitted','approved','rejected') then raise exception 'This bid can no longer be edited'; end if;
  update public.auction_bids
  set status = case when p_approve then 'approved' else 'rejected' end,
      approved_at = case when p_approve then coalesce(approved_at, now()) else null end,
      approved_by = case when p_approve then auth.uid() else null end
  where id = p_bid_id;
end;
$$;

create or replace function public._finalize_auction_cycle(p_cycle_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.monthly_cycles%rowtype;
  v_bid public.auction_bids%rowtype;
  v_commission bigint;
  v_discount bigint;
  v_pool bigint;
  v_divisor integer;
  v_per_head bigint;
  v_leftover bigint;
  v_winner_name text;
begin
  select * into v_cycle from public.monthly_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Auction cycle not found'; end if;
  if v_cycle.status = 'completed' then
    return jsonb_build_object('status','completed','winner_member_id',v_cycle.winner_member_id,'prize_paise',v_cycle.prize_paise);
  end if;
  if v_cycle.status <> 'open' then raise exception 'Auction is not open'; end if;
  if now() < v_cycle.auction_ends_at then raise exception 'Auction window has not ended'; end if;
  select b.* into v_bid
  from public.auction_bids b
  join public.members m on m.id = b.member_id and m.chit_id = b.chit_id
  where b.cycle_id = v_cycle.id and b.chit_id = v_cycle.chit_id
    and b.status = 'approved'
    and b.amount_paise >= v_cycle.floor_price_paise
    and b.amount_paise <= v_cycle.pot_paise
    and m.status <> 'removed'
    and not exists (select 1 from public.monthly_cycles oldc where oldc.chit_id = v_cycle.chit_id and oldc.status = 'completed' and oldc.winner_member_id = m.id)
  order by b.amount_paise asc, b.created_at asc
  limit 1 for update of b;
  if not found then raise exception 'No approved eligible bid is available'; end if;

  v_discount := v_cycle.pot_paise - v_bid.amount_paise;
  v_commission := floor(v_cycle.pot_paise::numeric * v_cycle.commission_pct / 100)::bigint;
  if v_discount < v_commission then raise exception 'Discount cannot be lower than foreman commission'; end if;
  v_pool := v_discount - v_commission;
  if v_cycle.dividend_rule = 'all_members' then
    select count(*) into v_divisor from public.members m where m.chit_id = v_cycle.chit_id and m.status <> 'removed';
  else
    select count(*) into v_divisor from public.members m where m.chit_id = v_cycle.chit_id and m.status <> 'removed' and m.id <> v_bid.member_id;
  end if;
  if v_divisor < 1 then raise exception 'No eligible dividend recipients'; end if;
  v_per_head := floor(v_pool::numeric / v_divisor)::bigint;
  v_leftover := v_pool - (v_per_head * v_divisor);
  select name into v_winner_name from public.members where id = v_bid.member_id;

  update public.monthly_cycles set
    status = 'completed',
    winner_member_id = v_bid.member_id,
    winning_bid_paise = v_bid.amount_paise,
    prize_paise = v_bid.amount_paise,
    discount_paise = v_discount,
    commission_paise = v_commission,
    dividend_pool_paise = v_pool,
    dividend_per_head_paise = v_per_head,
    rounding_leftover_paise = v_leftover,
    completed_at = now()
  where id = v_cycle.id;

  update public.members set status = 'winner' where id = v_bid.member_id;
  update public.auction_bids set status = 'winner' where id = v_bid.id;

  insert into public.dividend_history(chit_id, cycle_id, member_id, amount_paise)
  select v_cycle.chit_id, v_cycle.id, m.id, v_per_head
  from public.members m
  where m.chit_id = v_cycle.chit_id and m.status <> 'removed'
    and (v_cycle.dividend_rule = 'all_members' or m.id <> v_bid.member_id)
  on conflict (cycle_id, member_id) do nothing;

  return jsonb_build_object(
    'status','completed','winner_member_id',v_bid.member_id,'winner_name',v_winner_name,
    'prize_paise',v_bid.amount_paise,'discount_paise',v_discount,
    'commission_paise',v_commission,'dividend_pool_paise',v_pool,
    'dividend_per_head_paise',v_per_head,'rounding_leftover_paise',v_leftover,
    'dividend_recipients',v_divisor
  );
end;
$$;

create or replace function public.declare_auction_winner(p_cycle_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_chit_id uuid;
begin
  select chit_id into v_chit_id from public.monthly_cycles where id = p_cycle_id;
  if v_chit_id is null or not public.can_manage_chit(v_chit_id) then raise exception 'Only the chit organizer can declare this winner'; end if;
  return public._finalize_auction_cycle(p_cycle_id);
end;
$$;

create or replace function public.auto_declare_due_auctions()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_cycle record;
  v_count integer := 0;
begin
  for v_cycle in
    select id from public.monthly_cycles
    where status = 'open' and auction_ends_at < now()
    order by auction_ends_at
    for update skip locked
  loop
    begin
      perform public._finalize_auction_cycle(v_cycle.id);
      v_count := v_count + 1;
    exception when others then
      -- An auction with no valid approved bids remains open for organizer attention.
      null;
    end;
  end loop;
  return v_count;
end;
$$;

create or replace function public.submit_payment_report(
  p_cycle_id uuid,
  p_amount_paise bigint,
  p_mode text default 'upi',
  p_screenshot_path text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.monthly_cycles%rowtype;
  v_member public.members%rowtype;
  v_dividend bigint := 0;
  v_base_due bigint;
  v_paid bigint;
  v_fine bigint;
  v_due bigint;
  v_payment_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  if p_amount_paise <= 0 then raise exception 'Payment amount must be positive'; end if;
  if p_mode not in ('upi','cash','bank','other') then raise exception 'Invalid payment mode'; end if;
  select * into v_cycle from public.monthly_cycles where id = p_cycle_id;
  if not found or v_cycle.status <> 'completed' then raise exception 'The month must be completed before payment confirmation'; end if;
  select * into v_member from public.members where chit_id = v_cycle.chit_id and auth_user_id = auth.uid() and status <> 'removed';
  if not found then raise exception 'Active membership not found'; end if;
  select coalesce((select dh.amount_paise from public.dividend_history dh where dh.cycle_id = v_cycle.id and dh.member_id = v_member.id),0) into v_dividend;
  v_base_due := greatest(0, v_cycle.base_contribution_paise - v_dividend);
  v_fine := greatest(0,current_date-v_cycle.due_date) * v_cycle.late_fine_per_day_paise;
  select coalesce(sum(case when p.entry_type='reversal' then -p.amount_paise else p.amount_paise end),0)
    into v_paid from public.payments p where p.cycle_id=v_cycle.id and p.member_id=v_member.id and p.status='confirmed';
  v_due := greatest(0,v_base_due+v_fine-v_paid);
  if p_amount_paise > v_due then raise exception 'Reported amount exceeds the outstanding due'; end if;
  insert into public.payments(chit_id,cycle_id,member_id,entry_type,amount_paise,amount_due_snapshot_paise,mode,status,screenshot_path,created_by)
  values(v_cycle.chit_id,v_cycle.id,v_member.id,'payment',p_amount_paise,v_base_due+v_fine,p_mode,'reported',p_screenshot_path,auth.uid())
  returning id into v_payment_id;
  insert into public.payment_audit(chit_id,payment_id,actor_id,action,notes)
  values(v_cycle.chit_id,v_payment_id,auth.uid(),'reported','Member submitted a payment report for organizer verification');
  return v_payment_id;
end;
$$;

create or replace function public.record_organizer_payment(
  p_cycle_id uuid,
  p_member_id uuid,
  p_amount_paise bigint,
  p_mode text default 'cash',
  p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.monthly_cycles%rowtype;
  v_member public.members%rowtype;
  v_dividend bigint := 0;
  v_base_due bigint;
  v_paid bigint;
  v_fine bigint;
  v_due bigint;
  v_payment_id uuid;
begin
  select * into v_cycle from public.monthly_cycles where id=p_cycle_id;
  if not found or not public.can_manage_chit(v_cycle.chit_id) then raise exception 'Only the organizer can record cash or offline payments'; end if;
  if p_amount_paise<=0 then raise exception 'Payment amount must be positive'; end if;
  if p_mode not in ('upi','cash','bank','other') then raise exception 'Invalid payment mode'; end if;
  select * into v_member from public.members where id=p_member_id and chit_id=v_cycle.chit_id and status <> 'removed';
  if not found then raise exception 'Active member not found'; end if;
  select coalesce((select dh.amount_paise from public.dividend_history dh where dh.cycle_id=v_cycle.id and dh.member_id=v_member.id),0) into v_dividend;
  v_base_due:=greatest(0,v_cycle.base_contribution_paise-v_dividend);
  v_fine:=greatest(0,current_date-v_cycle.due_date)*v_cycle.late_fine_per_day_paise;
  select coalesce(sum(case when p.entry_type='reversal' then -p.amount_paise else p.amount_paise end),0)
    into v_paid from public.payments p where p.cycle_id=v_cycle.id and p.member_id=v_member.id and p.status='confirmed';
  v_due:=greatest(0,v_base_due+v_fine-v_paid);
  if p_amount_paise>v_due then raise exception 'Payment amount exceeds outstanding due'; end if;
  insert into public.payments(chit_id,cycle_id,member_id,entry_type,amount_paise,amount_due_snapshot_paise,mode,status,notes,created_by,confirmed_by,confirmed_at)
  values(v_cycle.chit_id,v_cycle.id,v_member.id,'payment',p_amount_paise,v_base_due+v_fine,p_mode,'confirmed',p_notes,auth.uid(),auth.uid(),now())
  returning id into v_payment_id;
  insert into public.payment_audit(chit_id,payment_id,actor_id,action,notes)
  values(v_cycle.chit_id,v_payment_id,auth.uid(),'confirmed',coalesce(p_notes,'Organizer recorded payment'));
  return v_payment_id;
end;
$$;

create or replace function public.confirm_payment_report(p_payment_id uuid, p_approve boolean, p_notes text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_payment public.payments%rowtype;
begin
  select * into v_payment from public.payments where id=p_payment_id for update;
  if not found then raise exception 'Payment report not found'; end if;
  if not public.can_manage_chit(v_payment.chit_id) then raise exception 'Only the organizer can confirm payment reports'; end if;
  if v_payment.status <> 'reported' then raise exception 'Only pending payment reports can be reviewed'; end if;
  update public.payments set status=case when p_approve then 'confirmed' else 'rejected' end,
    confirmed_by=case when p_approve then auth.uid() else null end,
    confirmed_at=case when p_approve then now() else null end,
    notes=coalesce(p_notes,notes)
  where id=p_payment_id;
  insert into public.payment_audit(chit_id,payment_id,actor_id,action,notes)
  values(v_payment.chit_id,v_payment.id,auth.uid(),case when p_approve then 'confirmed' else 'rejected' end,p_notes);
end;
$$;

create or replace function public.reverse_confirmed_payment(p_payment_id uuid, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_original public.payments%rowtype;
  v_already_reversed bigint;
  v_new_id uuid;
begin
  select * into v_original from public.payments where id=p_payment_id for update;
  if not found or not public.can_manage_chit(v_original.chit_id) then raise exception 'Only the organizer can reverse this payment'; end if;
  if v_original.entry_type <> 'payment' or v_original.status <> 'confirmed' then raise exception 'Only confirmed payment entries can be reversed'; end if;
  select coalesce(sum(amount_paise),0) into v_already_reversed from public.payments
    where original_payment_id=p_payment_id and entry_type='reversal' and status='confirmed';
  if v_already_reversed >= v_original.amount_paise then raise exception 'This payment has already been fully reversed'; end if;
  insert into public.payments(chit_id,cycle_id,member_id,entry_type,amount_paise,amount_due_snapshot_paise,mode,status,original_payment_id,notes,created_by,confirmed_by,confirmed_at)
  values(v_original.chit_id,v_original.cycle_id,v_original.member_id,'reversal',v_original.amount_paise-v_already_reversed,v_original.amount_due_snapshot_paise,v_original.mode,'confirmed',v_original.id,p_notes,auth.uid(),auth.uid(),now())
  returning id into v_new_id;
  insert into public.payment_audit(chit_id,payment_id,actor_id,action,notes)
  values(v_original.chit_id,v_new_id,auth.uid(),'reversal',coalesce(p_notes,'Correction recorded as a reversal entry'));
  return v_new_id;
end;
$$;

revoke all on function public.initialize_chit_cycles(uuid) from public, anon;
revoke all on function public.sync_open_auction_cycles(uuid) from public, anon;
revoke all on function public.place_auction_bid(uuid,bigint) from public, anon;
revoke all on function public.approve_auction_bid(uuid,boolean) from public, anon;
revoke all on function public.declare_auction_winner(uuid) from public, anon;
revoke all on function public._finalize_auction_cycle(uuid) from public, anon, authenticated;
revoke all on function public.auto_declare_due_auctions() from public, anon, authenticated;
revoke all on function public.submit_payment_report(uuid,bigint,text,text) from public, anon;
revoke all on function public.record_organizer_payment(uuid,uuid,bigint,text,text) from public, anon;
revoke all on function public.confirm_payment_report(uuid,boolean,text) from public, anon;
revoke all on function public.reverse_confirmed_payment(uuid,text) from public, anon;

grant select on public.profiles, public.chits, public.members, public.monthly_cycles, public.auction_bids, public.payments, public.dividend_history, public.payment_audit to authenticated;
grant insert, update on public.chits, public.members to authenticated;
-- Auction cycles and bids are mutated through controlled RPCs, not direct browser writes.
grant execute on function public.initialize_chit_cycles(uuid) to authenticated;
grant execute on function public.sync_open_auction_cycles(uuid) to authenticated;
grant execute on function public.place_auction_bid(uuid,bigint) to authenticated;
grant execute on function public.approve_auction_bid(uuid,boolean) to authenticated;
grant execute on function public.declare_auction_winner(uuid) to authenticated;
grant execute on function public.submit_payment_report(uuid,bigint,text,text) to authenticated;
grant execute on function public.record_organizer_payment(uuid,uuid,bigint,text,text) to authenticated;
grant execute on function public.confirm_payment_report(uuid,boolean,text) to authenticated;
grant execute on function public.reverse_confirmed_payment(uuid,text) to authenticated;
grant execute on function public.auto_declare_due_auctions() to service_role;

-- Schedule public.auto_declare_due_auctions() using Supabase Cron/pg_cron once the project is configured.
-- Store only the Supabase URL and publishable/anon key in the browser; enforce all access through RLS.
-- Payment gateway callbacks and verified UPI status require a separate server-side provider integration.
