-- TeaTime Rewards. Run once in the Supabase SQL editor on a new project.
create extension if not exists pgcrypto;
create table public.loyalty_settings (id boolean primary key default true check(id), enabled boolean not null default false, wheel_enabled boolean not null default false, points_per_kes integer not null default 100 check(points_per_kes>0));
insert into public.loyalty_settings default values;
create table public.loyalty_members (id uuid primary key references auth.users on delete cascade, name text not null, phone text, role text not null default 'customer' check(role in ('customer','staff','admin')), suspended boolean not null default false, marketing boolean not null default false, terms_at timestamptz not null default now(), membership uuid not null unique default gen_random_uuid(), created_at timestamptz not null default now());
create table public.loyalty_rewards (id uuid primary key default gen_random_uuid(), name text not null, description text not null, points integer not null check(points>0), active boolean not null default false, validity_days integer not null default 30 check(validity_days between 1 and 365), stock integer check(stock>=0));
insert into public.loyalty_rewards(name,description,points) values ('Tea on us','One standard tea. Participating Lavington branch only; confirm eligible tea with staff.',100),('A little treat','One selected pastry, subject to availability. Confirm eligible items with staff.',180),('The perfect pairing','One standard tea and one selected pastry at the participating branch.',250),('Something delicious','KSh 200 off a meal of KSh 200 or more. No cash alternative.',400);
create table public.loyalty_wheels (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), active boolean not null default false, prizes jsonb not null);
insert into public.loyalty_wheels(active,prizes) values(true,'[{"label":"5 points","points":5,"weight":40},{"label":"10 points","points":10,"weight":30},{"label":"20 points","points":20,"weight":20},{"label":"50 points","points":50,"weight":9},{"label":"Free tea","points":0,"weight":1}]');
create table public.loyalty_purchases (id uuid primary key default gen_random_uuid(), member uuid not null references public.loyalty_members, receipt text not null unique, amount_minor bigint not null check(amount_minor>0), points integer not null, staff uuid not null references public.loyalty_members, reversed boolean not null default false, created_at timestamptz not null default now());
create table public.loyalty_ledger (id uuid primary key default gen_random_uuid(), member uuid not null references public.loyalty_members, amount integer not null, description text not null, reference uuid, created_at timestamptz not null default now());
create table public.loyalty_spins (id uuid primary key default gen_random_uuid(), member uuid not null references public.loyalty_members, local_day date not null, wheel uuid not null references public.loyalty_wheels, result jsonb not null, created_at timestamptz not null default now(), unique(member,local_day));
create table public.loyalty_vouchers (id uuid primary key default gen_random_uuid(), member uuid not null references public.loyalty_members, code uuid not null unique default gen_random_uuid(), name text not null, terms text not null, status text not null default 'active' check(status in ('active','used','cancelled')), expires_at timestamptz not null, used_by uuid references public.loyalty_members, used_at timestamptz, request_id uuid not null unique, created_at timestamptz not null default now());
create table public.loyalty_audit (id bigint generated always as identity primary key, actor uuid, action text not null, details jsonb not null, created_at timestamptz default now());
create table public.loyalty_consent (id bigint generated always as identity primary key, member uuid not null references public.loyalty_members, marketing boolean not null, terms_version text not null default 'MVP-1', created_at timestamptz default now());

create function public.loyalty_role() returns text language sql stable security definer set search_path=public,extensions as $$ select role from loyalty_members where id=auth.uid() and not suspended $$;
create function public.loyalty_balance(who uuid) returns bigint language sql stable security definer set search_path=public,extensions as $$ select coalesce(sum(amount),0) from loyalty_ledger where member=who and (who=auth.uid() or loyalty_role() in ('staff','admin')) $$;
create function public.loyalty_join() returns trigger language plpgsql security definer set search_path=public,extensions as $$
begin
 if coalesce(new.raw_user_meta_data->>'terms','false') <> 'true' then raise exception 'Programme terms must be accepted'; end if;
 insert into loyalty_members(id,name,phone,marketing) values(new.id,left(coalesce(new.raw_user_meta_data->>'name','Guest'),80),left(new.raw_user_meta_data->>'phone',30),coalesce((new.raw_user_meta_data->>'marketing')::boolean,false));
 insert into loyalty_consent(member,marketing) values(new.id,coalesce((new.raw_user_meta_data->>'marketing')::boolean,false));
 return new;
end $$;
create trigger loyalty_signup after insert on auth.users for each row execute function public.loyalty_join();

-- All mutations go through this role-checked transaction function. Direct table writes are denied.
create function public.loyalty_action(action text, payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
 me loyalty_members; target loyalty_members; settings loyalty_settings; r loyalty_rewards; v loyalty_vouchers; p loyalty_purchases; w loyalty_wheels; s loyalty_spins;
 chosen jsonb; item jsonb; total integer:=0; draw integer; cumulative integer:=0; earned integer; amount bigint; req uuid; result jsonb; day date:=(now() at time zone 'Africa/Nairobi')::date;
begin
 select * into me from loyalty_members where id=auth.uid() for update;
 if me.id is null or me.suspended then raise exception 'Account unavailable. Please contact TeaTime.'; end if;
 select * into settings from loyalty_settings where id=true;
 if action='profile' then
  if length(trim(payload->>'name')) not between 1 and 80 then raise exception 'Enter a name between 1 and 80 characters'; end if;
  update loyalty_members set name=trim(payload->>'name'), phone=left(payload->>'phone',30),marketing=coalesce((payload->>'marketing')::boolean,false) where id=me.id;
  insert into loyalty_consent(member,marketing) values(me.id,coalesce((payload->>'marketing')::boolean,false));
  return jsonb_build_object('message','Profile saved');
 elsif action='spin' then
  select * into s from loyalty_spins where member=me.id and local_day=day;
  if found then return s.result; end if;
  if not settings.enabled or not settings.wheel_enabled then raise exception 'Daily spins are not open yet'; end if;
  select * into w from loyalty_wheels where active limit 1;
  if w.id is null then raise exception 'No active wheel'; end if;
  for item in select * from jsonb_array_elements(w.prizes) loop total:=total+(item->>'weight')::integer; end loop;
  if total<>100 then raise exception 'Wheel configuration unavailable'; end if;
  -- Rejection sampling avoids modulo bias in 100 equally likely outcomes.
  loop draw:=get_byte(gen_random_bytes(1),0); exit when draw<200; end loop;
  draw:=draw%100;
  for item in select * from jsonb_array_elements(w.prizes) loop
   cumulative:=cumulative+(item->>'weight')::integer;
   if draw<cumulative then chosen:=item; exit; end if;
  end loop;
  insert into loyalty_spins(member,local_day,wheel,result) values(me.id,day,w.id,chosen) returning * into s;
  earned:=(chosen->>'points')::integer;
  if earned>0 then insert into loyalty_ledger(member,amount,description,reference) values(me.id,earned,'Daily spin · '||(chosen->>'label'),s.id);
  else insert into loyalty_vouchers(member,name,terms,expires_at,request_id) values(me.id,'Tea on us','One standard tea. Lavington branch only. No cash alternative.',now()+interval '7 days',s.id); end if;
  return chosen;
 elsif action='redeem' then
  req:=(payload->>'request_id')::uuid;
  select * into v from loyalty_vouchers where request_id=req;
  if found then
   if v.member<>me.id then raise exception 'Invalid request'; end if;
   return to_jsonb(v);
  end if;
  if not settings.enabled then raise exception 'Rewards are not open yet'; end if;
  select * into r from loyalty_rewards where id=(payload->>'reward')::uuid for update;
  if r.id is null or not r.active or r.stock=0 then raise exception 'Reward unavailable'; end if;
  if loyalty_balance(me.id)<r.points then raise exception 'Not enough points'; end if;
  insert into loyalty_vouchers(member,name,terms,expires_at,request_id) values(me.id,r.name,r.description,now()+make_interval(days=>r.validity_days),req) returning * into v;
  insert into loyalty_ledger(member,amount,description,reference) values(me.id,-r.points,'Reward · '||r.name,v.id);
  update loyalty_rewards set stock=stock-1 where id=r.id and stock is not null;
  return to_jsonb(v);
 end if;
 if me.role not in ('staff','admin') then raise exception 'Staff access required'; end if;
 if action in ('lookup','voucher_check','voucher_use') then
  if (select count(*) from loyalty_audit a where a.actor=me.id and a.created_at>now()-interval '1 minute' and a.action in ('lookup','voucher_check','voucher_use'))>=30 then raise exception 'Too many attempts. Wait one minute.'; end if;
  insert into loyalty_audit(actor,action,details) values(me.id,action,'{}');
  if coalesce(payload->>case when action='lookup' then 'membership' else 'code' end,'') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return jsonb_build_object('error','Enter a valid membership or voucher code'); end if;
 end if;
 if action='lookup' then
  select * into target from loyalty_members where membership=(payload->>'membership')::uuid;
  if target.id is null then return jsonb_build_object('error','Membership not found'); end if;
  return jsonb_build_object('id',target.id,'name',target.name,'membership',target.membership,'suspended',target.suspended,'balance',loyalty_balance(target.id));
 elsif action='purchase' then
  select * into target from loyalty_members where membership=(payload->>'membership')::uuid for update;
  if target.id is null or target.suspended then raise exception 'Membership unavailable'; end if;
  if not settings.enabled then raise exception 'Programme is not active'; end if;
  amount:=(payload->>'amount_minor')::bigint;
  if amount<=0 or amount>100000000 or length(trim(payload->>'receipt')) not between 1 and 100 then raise exception 'Enter a valid amount and receipt'; end if;
  earned:=floor(amount::numeric/(settings.points_per_kes*100))::integer;
  insert into loyalty_purchases(member,receipt,amount_minor,points,staff) values(target.id,trim(payload->>'receipt'),amount,earned,me.id) returning * into p;
  insert into loyalty_ledger(member,amount,description,reference) values(target.id,earned,'Purchase · '||p.receipt,p.id);
  result:=jsonb_build_object('message',earned||' points added','purchase_id',p.id);
 elsif action='voucher_check' then
  select * into v from loyalty_vouchers where code=(payload->>'code')::uuid;
  if v.id is null then return jsonb_build_object('error','Voucher not found'); end if;
  return to_jsonb(v)||jsonb_build_object('expired',v.expires_at<=now());
 elsif action='voucher_use' then
  select * into v from loyalty_vouchers where code=(payload->>'code')::uuid for update;
  if v.id is null or v.status<>'active' or v.expires_at<=now() then return jsonb_build_object('error','Voucher invalid, expired or already used'); end if;
  update loyalty_vouchers set status='used',used_by=me.id,used_at=now() where id=v.id;
  result:=jsonb_build_object('message','Voucher redeemed successfully');
 else
  if me.role<>'admin' then raise exception 'Admin access required'; end if;
  if action='settings' then
   if (payload->>'points_per_kes')::integer not between 1 and 100000 then raise exception 'Invalid earning rate'; end if;
   update loyalty_settings set enabled=(payload->>'enabled')::boolean,wheel_enabled=(payload->>'wheel_enabled')::boolean,points_per_kes=(payload->>'points_per_kes')::integer where id=true;
  elsif action='reward' then
   if length(trim(payload->>'name')) not between 1 and 100 or (payload->>'points')::integer<=0 then raise exception 'Invalid reward'; end if;
   insert into loyalty_rewards(id,name,description,points,active,validity_days,stock) values(coalesce((payload->>'id')::uuid,gen_random_uuid()),trim(payload->>'name'),payload->>'description',(payload->>'points')::integer,(payload->>'active')::boolean,(payload->>'validity_days')::integer,(payload->>'stock')::integer)
   on conflict(id) do update set name=excluded.name,description=excluded.description,points=excluded.points,active=excluded.active,validity_days=excluded.validity_days,stock=excluded.stock;
  elsif action='wheel' then
   if jsonb_array_length(payload->'prizes')<>5 then raise exception 'Exactly five prize levels required'; end if;
   for item in select * from jsonb_array_elements(payload->'prizes') loop
    if (item->>'weight')::integer<0 or (item->>'points')::integer<0 or length(item->>'label') not between 1 and 40 then raise exception 'Invalid prize'; end if;
    total:=total+(item->>'weight')::integer;
   end loop;
   if total<>100 then raise exception 'Probabilities must total 100%%'; end if;
   update loyalty_wheels set active=false where active;
   insert into loyalty_wheels(active,prizes) values(true,payload->'prizes');
  elsif action in ('adjust','suspend','role') then
   select * into target from loyalty_members where id=(payload->>'member')::uuid for update;
   if target.id is null then raise exception 'Customer not found'; end if;
   if action='adjust' then
    earned:=(payload->>'amount')::integer;
    if length(trim(payload->>'reason'))<3 then raise exception 'A reason is required'; end if;
    if loyalty_balance(target.id)+earned<0 then raise exception 'Insufficient balance'; end if;
    insert into loyalty_ledger(member,amount,description) values(target.id,earned,'Adjustment · '||(payload->>'reason'));
   elsif action='suspend' then
    if target.id=me.id then raise exception 'Cannot suspend yourself'; end if;
    update loyalty_members set suspended=(payload->>'suspended')::boolean where id=target.id;
   else
    if target.id=me.id or payload->>'role' not in ('customer','staff','admin') then raise exception 'Invalid role change'; end if;
    update loyalty_members set role=payload->>'role' where id=target.id;
   end if;
  elsif action='reverse' then
   -- All customer balance changes use the same member lock before purchase locks.
   select * into p from loyalty_purchases where id=(payload->>'purchase')::uuid;
   perform 1 from loyalty_members where id=p.member for update;
   select * into p from loyalty_purchases where id=(payload->>'purchase')::uuid for update;
   if p.id is null or p.reversed then raise exception 'Purchase unavailable or already reversed'; end if;
   if length(trim(payload->>'reason'))<3 then raise exception 'A reason is required'; end if;
   if loyalty_balance(p.member)<p.points then raise exception 'Reversal would make balance negative; admin resolution required'; end if;
   update loyalty_purchases set reversed=true where id=p.id;
   insert into loyalty_ledger(member,amount,description,reference) values(p.member,-p.points,'Reversal · '||(payload->>'reason'),p.id);
  else raise exception 'Unknown action'; end if;
  result:=jsonb_build_object('message','Changes saved');
 end if;
 insert into loyalty_audit(actor,action,details) values(me.id,action,payload);
 return result;
end $$;

alter table loyalty_settings enable row level security;
alter table loyalty_members enable row level security;
alter table loyalty_rewards enable row level security;
alter table loyalty_wheels enable row level security;
alter table loyalty_purchases enable row level security;
alter table loyalty_ledger enable row level security;
alter table loyalty_spins enable row level security;
alter table loyalty_vouchers enable row level security;
alter table loyalty_audit enable row level security;
alter table loyalty_consent enable row level security;
create policy settings_read on loyalty_settings for select to authenticated using(true);
create policy members_read on loyalty_members for select to authenticated using(id=auth.uid() or loyalty_role()='admin');
create policy rewards_read on loyalty_rewards for select to authenticated using(active or loyalty_role()='admin');
create policy wheel_read on loyalty_wheels for select to authenticated using(active or loyalty_role()='admin');
create policy purchases_read on loyalty_purchases for select to authenticated using(member=auth.uid() or loyalty_role()='admin');
create policy ledger_read on loyalty_ledger for select to authenticated using(member=auth.uid() or loyalty_role()='admin');
create policy spins_read on loyalty_spins for select to authenticated using(member=auth.uid() or loyalty_role()='admin');
create policy vouchers_read on loyalty_vouchers for select to authenticated using(member=auth.uid() or loyalty_role()='admin');
create policy audit_read on loyalty_audit for select to authenticated using(loyalty_role()='admin');
create policy consent_read on loyalty_consent for select to authenticated using(member=auth.uid() or loyalty_role()='admin');
revoke all on loyalty_settings,loyalty_members,loyalty_rewards,loyalty_wheels,loyalty_purchases,loyalty_ledger,loyalty_spins,loyalty_vouchers,loyalty_audit,loyalty_consent from anon;
revoke insert,update,delete on loyalty_settings,loyalty_members,loyalty_rewards,loyalty_wheels,loyalty_purchases,loyalty_ledger,loyalty_spins,loyalty_vouchers,loyalty_audit,loyalty_consent from authenticated;
grant select on loyalty_settings,loyalty_members,loyalty_rewards,loyalty_wheels,loyalty_purchases,loyalty_ledger,loyalty_spins,loyalty_vouchers,loyalty_audit,loyalty_consent to authenticated;
revoke execute on function public.loyalty_action(text,jsonb),public.loyalty_balance(uuid),public.loyalty_role(),public.loyalty_join() from public,anon;
grant execute on function public.loyalty_action(text,jsonb),public.loyalty_balance(uuid),public.loyalty_role() to authenticated;

create function public.loyalty_metrics() returns jsonb language plpgsql stable security definer set search_path=public,extensions as $$
begin
 if loyalty_role()<>'admin' or loyalty_role() is null then raise exception 'Admin access required'; end if;
 return jsonb_build_object(
 'members',(select count(*) from loyalty_members),
 'new_members_30_days',(select count(*) from loyalty_members where created_at>=now()-interval '30 days'),
 'spins',(select count(*) from loyalty_spins),
 'spins_today',(select count(*) from loyalty_spins where local_day=(now() at time zone 'Africa/Nairobi')::date),
 'points_issued',(select coalesce(sum(amount),0) from loyalty_ledger where amount>0),
 'purchase_points',(select coalesce(sum(amount),0) from loyalty_ledger where amount>0 and description like 'Purchase%'),
 'spin_points',(select coalesce(sum(amount),0) from loyalty_ledger where amount>0 and description like 'Daily spin%'),
 'points_spent',(select coalesce(-sum(amount),0) from loyalty_ledger where amount<0 and description like 'Reward%'),
 'outstanding_points',(select coalesce(sum(amount),0) from loyalty_ledger),
 'vouchers_issued',(select count(*) from loyalty_vouchers),
 'vouchers_used',(select count(*) from loyalty_vouchers where status='used'),
 'recorded_purchases_KSh',(select coalesce(sum(amount_minor),0)/100.0 from loyalty_purchases where not reversed));
end $$;
revoke execute on function public.loyalty_metrics() from public,anon;
grant execute on function public.loyalty_metrics() to authenticated;
