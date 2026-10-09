-- Committee Book templates 03/04: Lottery/Kuri and Fixed Rotation BC.
-- Additive schema: run AFTER committee-book/auction-schema.sql in a new Supabase project.
-- This does not connect the browser demo to a live backend. Configure and test RLS/Auth separately.
-- Never expose a service_role key to browser code. Get qualified legal review before operating a live chit.

alter table public.chits
  add column if not exists chit_type text not null default 'auction'
    check (chit_type in ('auction','fixed_discount','lottery','fixed_rotation')),
  add column if not exists draw_day integer not null default 5 check (draw_day between 1 and 31),
  add column if not exists distribution_day integer not null default 5 check (distribution_day between 1 and 31),
  add column if not exists interest_enabled boolean not null default false,
  add column if not exists interest_paise bigint not null default 0 check (interest_paise >= 0),
  add column if not exists order_locked boolean not null default false;

alter table public.members
  add column if not exists order_index integer,
  add column if not exists scheduled_month integer;

create index if not exists members_chit_order_idx on public.members(chit_id, order_index);
create index if not exists members_chit_scheduled_month_idx on public.members(chit_id, scheduled_month);

create table if not exists public.lottery_draws (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  cycle_id uuid not null,
  winner_member_id uuid not null,
  prize_paise bigint not null check (prize_paise >= 0),
  commission_paise bigint not null default 0 check (commission_paise >= 0),
  random_seed text not null,
  selection_method text not null default 'server-seeded',
  eligible_count integer not null check (eligible_count > 0),
  draw_at timestamptz not null default now(),
  confirmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (cycle_id),
  unique (chit_id, winner_member_id),
  foreign key (cycle_id, chit_id) references public.monthly_cycles(id, chit_id) on delete restrict,
  foreign key (winner_member_id, chit_id) references public.members(id, chit_id) on delete restrict
);
create index if not exists lottery_draws_chit_date_idx on public.lottery_draws(chit_id, draw_at desc);

-- Each entry is either extra interest paid by an earlier winner or a credit distributed to a recipient.
-- All amounts are integer paise. The original rows remain in the ledger for auditability.
create table if not exists public.interest_ledger (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete restrict,
  cycle_id uuid not null,
  entry_type text not null check (entry_type in ('contribution','distribution','reversal')),
  source_member_id uuid not null,
  recipient_member_id uuid,
  amount_paise bigint not null check (amount_paise > 0),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (cycle_id, chit_id) references public.monthly_cycles(id, chit_id) on delete restrict,
  foreign key (source_member_id, chit_id) references public.members(id, chit_id) on delete restrict,
  foreign key (recipient_member_id, chit_id) references public.members(id, chit_id) on delete restrict,
  check ((entry_type='contribution' and recipient_member_id is null) or
         (entry_type in ('distribution','reversal') and recipient_member_id is not null))
);
create index if not exists interest_ledger_cycle_idx on public.interest_ledger(chit_id, cycle_id, created_at);
create index if not exists interest_ledger_recipient_idx on public.interest_ledger(chit_id, recipient_member_id, created_at);

alter table public.lottery_draws enable row level security;
alter table public.interest_ledger enable row level security;

drop policy if exists "lottery_draws_select_participants" on public.lottery_draws;
create policy "lottery_draws_select_participants" on public.lottery_draws for select to authenticated
using (public.is_chit_participant(chit_id));

drop policy if exists "interest_ledger_select_participants" on public.interest_ledger;
create policy "interest_ledger_select_participants" on public.interest_ledger for select to authenticated
using (public.is_chit_participant(chit_id));

grant select on public.lottery_draws, public.interest_ledger to authenticated;
-- There are intentionally no direct browser insert/update/delete policies for draw results or interest entries.
-- Only the SECURITY DEFINER RPCs below can finalize a draw or post an interest ledger.

create or replace function public.declare_lottery_draw(p_cycle_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.monthly_cycles%rowtype;
  v_chit public.chits%rowtype;
  v_winner_id uuid;
  v_seed text;
  v_count integer;
  v_commission bigint;
  v_prize bigint;
  v_winner_name text;
begin
  select * into v_cycle from public.monthly_cycles where id=p_cycle_id for update;
  if not found then raise exception 'Lottery cycle not found'; end if;
  if not public.can_manage_chit(v_cycle.chit_id) then raise exception 'Only the chit organizer can declare a draw'; end if;
  select * into v_chit from public.chits where id=v_cycle.chit_id for update;
  if v_chit.chit_type <> 'lottery' then raise exception 'This chit is not configured as a lottery/kuri'; end if;
  if v_cycle.status='completed' then raise exception 'This draw is already confirmed'; end if;
  if v_cycle.status not in ('open','upcoming') then raise exception 'This cycle cannot be drawn'; end if;
  -- In a lottery configuration auction_ends_at is the scheduled draw cutoff.
  if now() < v_cycle.auction_ends_at then raise exception 'Draw date/time has not arrived yet'; end if;
  if exists(select 1 from public.lottery_draws where cycle_id=p_cycle_id) then raise exception 'A draw already exists for this cycle'; end if;

  select count(*) into v_count
  from public.members m
  where m.chit_id=v_cycle.chit_id and m.status<>'removed'
    and not exists (
      select 1 from public.monthly_cycles prev
      where prev.chit_id=v_cycle.chit_id and prev.status='completed'
        and prev.winner_member_id=m.id
    );
  if v_count=0 then raise exception 'No eligible non-winner members remain'; end if;

  -- The server creates the seed. Sorting by hash provides a reproducible result from the stored seed.
  v_seed := encode(gen_random_bytes(16),'hex');
  select m.id into v_winner_id
  from public.members m
  where m.chit_id=v_cycle.chit_id and m.status<>'removed'
    and not exists (
      select 1 from public.monthly_cycles prev
      where prev.chit_id=v_cycle.chit_id and prev.status='completed'
        and prev.winner_member_id=m.id
    )
  order by encode(digest(v_seed || m.id::text,'sha256'),'hex')
  limit 1 for update;
  if v_winner_id is null then raise exception 'Unable to pick an eligible member'; end if;

  v_commission := floor(v_cycle.pot_paise::numeric * v_cycle.commission_pct / 100)::bigint;
  v_prize := greatest(0,v_cycle.pot_paise-v_commission);
  select name into v_winner_name from public.members where id=v_winner_id;

  insert into public.lottery_draws(chit_id,cycle_id,winner_member_id,prize_paise,commission_paise,random_seed,selection_method,eligible_count,confirmed_by)
  values(v_cycle.chit_id,v_cycle.id,v_winner_id,v_prize,v_commission,v_seed,'server-seeded-sha256-order',v_count,auth.uid());

  update public.monthly_cycles set
    status='completed',winner_member_id=v_winner_id,winning_bid_paise=null,
    prize_paise=v_prize,discount_paise=0,commission_paise=v_commission,
    dividend_pool_paise=0,dividend_per_head_paise=0,rounding_leftover_paise=0,
    completed_at=now()
  where id=v_cycle.id;
  update public.members set status='winner' where id=v_winner_id;

  return jsonb_build_object('status','completed','winner_member_id',v_winner_id,
    'winner_name',v_winner_name,'prize_paise',v_prize,'commission_paise',v_commission,
    'dividend_paise',0,'random_seed',v_seed,'eligible_count',v_count);
end;
$$;

create or replace function public.complete_fixed_rotation_turn(p_cycle_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.monthly_cycles%rowtype;
  v_chit public.chits%rowtype;
  v_winner_id uuid;
  v_prize bigint;
  v_commission bigint;
  v_winner_name text;
  v_payer record;
  v_target record;
  v_targets integer;
  v_base_share bigint;
  v_remainder bigint;
  v_row_no integer;
  v_offset integer;
  v_interest bigint;
begin
  select * into v_cycle from public.monthly_cycles where id=p_cycle_id for update;
  if not found then raise exception 'Rotation cycle not found'; end if;
  if not public.can_manage_chit(v_cycle.chit_id) then raise exception 'Only the chit organizer can complete a turn'; end if;
  select * into v_chit from public.chits where id=v_cycle.chit_id for update;
  if v_chit.chit_type <> 'fixed_rotation' then raise exception 'This chit is not configured as fixed rotation'; end if;
  if v_cycle.status='completed' then raise exception 'This turn is already recorded'; end if;
  if v_cycle.status not in ('open','upcoming') then raise exception 'This turn cannot be completed'; end if;
  if not v_chit.order_locked then raise exception 'Start the chit and lock the order before recording turns'; end if;
  if (select count(*) from public.members m where m.chit_id=v_cycle.chit_id and m.status<>'removed' and m.order_index is not null) <> v_chit.member_count then
    raise exception 'Every active member must have a fixed rotation order';
  end if;
  select m.id into v_winner_id
    from public.members m
    where m.chit_id=v_cycle.chit_id and m.status<>'removed'
      and m.order_index=v_cycle.month_no
      and not exists (select 1 from public.monthly_cycles p where p.chit_id=v_cycle.chit_id and p.status='completed' and p.winner_member_id=m.id)
    for update;
  if v_winner_id is null then raise exception 'No eligible member is assigned to this turn'; end if;

  v_commission := floor(v_cycle.pot_paise::numeric*v_cycle.commission_pct/100)::bigint;
  v_prize := greatest(0,v_cycle.pot_paise-v_commission);
  select name into v_winner_name from public.members where id=v_winner_id;

  update public.monthly_cycles set
    status='completed',winner_member_id=v_winner_id,winning_bid_paise=null,
    prize_paise=v_prize,discount_paise=0,commission_paise=v_commission,
    dividend_pool_paise=0,dividend_per_head_paise=0,rounding_leftover_paise=0,
    completed_at=now()
  where id=v_cycle.id;
  update public.members set status='winner' where id=v_winner_id;

  -- Each earlier winner pays the optional monthly extra. Each payer's entry is then
  -- divided among all other active members; remainder paise are allocated in order.
  if v_chit.interest_enabled and v_chit.interest_paise>0 then
    for v_payer in
      select prev.winner_member_id as member_id
      from public.monthly_cycles prev
      where prev.chit_id=v_cycle.chit_id and prev.status='completed'
        and prev.month_no<v_cycle.month_no and prev.winner_member_id is not null
      order by prev.month_no
    loop
      v_interest := v_chit.interest_paise;
      insert into public.interest_ledger(chit_id,cycle_id,entry_type,source_member_id,recipient_member_id,amount_paise,created_by,note)
      values(v_cycle.chit_id,v_cycle.id,'contribution',v_payer.member_id,null,v_interest,auth.uid(),'Monthly extra interest from an earlier winner');

      select count(*) into v_targets from public.members m
        where m.chit_id=v_cycle.chit_id and m.status<>'removed' and m.id<>v_payer.member_id;
      if v_targets>0 then
        v_base_share := floor(v_interest::numeric/v_targets)::bigint;
        v_remainder := v_interest-(v_base_share*v_targets);
        v_offset := mod(v_cycle.month_no + v_cycle.month_no, greatest(v_targets,1));
        v_row_no := 0;
        for v_target in
          select m.id, row_number() over(order by m.order_index,m.id)::integer as rn
          from public.members m
          where m.chit_id=v_cycle.chit_id and m.status<>'removed' and m.id<>v_payer.member_id
          order by m.order_index,m.id
        loop
          v_row_no := v_row_no+1;
          insert into public.interest_ledger(chit_id,cycle_id,entry_type,source_member_id,recipient_member_id,amount_paise,created_by,note)
          values(v_cycle.chit_id,v_cycle.id,'distribution',v_payer.member_id,v_target.id,
            v_base_share + case when mod(v_target.rn-1-v_offset+v_targets,v_targets)<v_remainder then 1 else 0 end,
            auth.uid(),'Share of early-taker interest pool');
        end loop;
      end if;
    end loop;
  end if;

  return jsonb_build_object('status','completed','winner_member_id',v_winner_id,
    'winner_name',v_winner_name,'prize_paise',v_prize,'commission_paise',v_commission,
    'dividend_paise',0,'interest_enabled',v_chit.interest_enabled);
end;
$$;

-- Optional organizer action: update a member's order only before the chit starts.
create or replace function public.set_fixed_rotation_order(p_chit_id uuid, p_member_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_expected integer;
  v_unique integer;
  v_updated integer := 0;
  v_id uuid;
  v_pos integer := 0;
begin
  if not public.can_manage_chit(p_chit_id) then raise exception 'Only the organizer can set order'; end if;
  if exists(select 1 from public.chits c where c.id=p_chit_id and c.order_locked) then
    raise exception 'Rotation order is locked after chit start';
  end if;
  select member_count into v_expected from public.chits where id=p_chit_id for update;
  if v_expected is null then raise exception 'Chit not found'; end if;
  select count(distinct x),count(*) into v_unique,v_updated from unnest(p_member_ids) x;
  if v_unique<>v_expected or v_updated<>v_expected then raise exception 'The order must contain every configured member exactly once'; end if;
  if exists(select 1 from public.members m where m.chit_id=p_chit_id and m.status<>'removed') and
     (select count(*) from public.members m where m.chit_id=p_chit_id and m.status<>'removed')<>v_expected then
    raise exception 'Active member count must match configured member count';
  end if;
  foreach v_id in array p_member_ids loop
    v_pos:=v_pos+1;
    update public.members set order_index=v_pos,scheduled_month=v_pos
      where id=v_id and chit_id=p_chit_id and status<>'removed';
  end loop;
  if v_pos<>v_expected then raise exception 'Some order entries were invalid or removed'; end if;
  return v_updated;
end;
$$;

create or replace function public.start_fixed_rotation_chit(p_chit_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_count integer; v_expected integer;
begin
  if not public.can_manage_chit(p_chit_id) then raise exception 'Only the organizer can start this chit'; end if;
  select member_count into v_expected from public.chits where id=p_chit_id for update;
  if v_expected is null then raise exception 'Chit not found'; end if;
  select count(*) into v_count from public.members m
   where m.chit_id=p_chit_id and m.status<>'removed' and m.order_index between 1 and v_expected;
  if v_count<>v_expected then raise exception 'Set the full fixed order before starting'; end if;
  update public.chits set order_locked=true,status='active' where id=p_chit_id;
end;
$$;

revoke all on function public.declare_lottery_draw(uuid) from public, anon;
revoke all on function public.complete_fixed_rotation_turn(uuid) from public, anon;
revoke all on function public.set_fixed_rotation_order(uuid,uuid[]) from public, anon;
revoke all on function public.start_fixed_rotation_chit(uuid) from public, anon;
grant execute on function public.declare_lottery_draw(uuid) to authenticated;
grant execute on function public.complete_fixed_rotation_turn(uuid) to authenticated;
grant execute on function public.set_fixed_rotation_order(uuid,uuid[]) to authenticated;
grant execute on function public.start_fixed_rotation_chit(uuid) to authenticated;

-- Configure cycle dates for lottery draws before enabling the RPC. In lottery mode,
-- monthly_cycles.auction_ends_at is used as the scheduled draw cutoff date/time.
-- Extend the existing organizer/member payment RPCs to add the fixed-rotation interest
-- surcharge to the due amount before allowing production payment confirmation.
