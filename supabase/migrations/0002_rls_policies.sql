-- Row Level Security: العميل يشوف بياناته بس، المندوب يشوف طلباته المتكلف بيها بس،
-- الموظف (pharmacist/admin) يشوف ويدير كل حاجة.

create function public.current_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- يمنع أي مستخدم غير admin من تغيير role بتاعه لنفسه (حماية من تصعيد الصلاحيات)
create function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.current_role() <> 'admin' then
    raise exception 'مش مسموح تغيير الدور (role) إلا لحساب admin';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.medicines enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.prescriptions enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.courier_locations enable row level security;

-- profiles
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.current_role() in ('pharmacist', 'admin'));
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

-- addresses
create policy addresses_select on public.addresses
  for select using (customer_id = auth.uid() or public.current_role() in ('pharmacist', 'admin'));
create policy addresses_insert on public.addresses
  for insert with check (customer_id = auth.uid());
create policy addresses_update on public.addresses
  for update using (customer_id = auth.uid());
create policy addresses_delete on public.addresses
  for delete using (customer_id = auth.uid());

-- categories: قراءة عامة، كتابة للموظفين بس
create policy categories_select on public.categories for select using (true);
create policy categories_write on public.categories
  for all using (public.current_role() in ('pharmacist', 'admin'))
  with check (public.current_role() in ('pharmacist', 'admin'));

-- medicines: العميل يشوف المتاح بس، الموظف يشوف ويدير الكل
create policy medicines_select_active on public.medicines
  for select using (active = true or public.current_role() in ('pharmacist', 'admin'));
create policy medicines_write on public.medicines
  for all using (public.current_role() in ('pharmacist', 'admin'))
  with check (public.current_role() in ('pharmacist', 'admin'));

-- orders: الإنشاء يتم فقط عن طريق دالة create_order (security definer) — مفيش insert policy هنا عمدًا
create policy orders_select on public.orders
  for select using (
    customer_id = auth.uid()
    or courier_id = auth.uid()
    or public.current_role() in ('pharmacist', 'admin')
  );
create policy orders_update_staff on public.orders
  for update using (public.current_role() in ('pharmacist', 'admin'));

-- order_items: القراءة حسب ملكية الطلب، الإدخال فقط عن طريق create_order
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or o.courier_id = auth.uid() or public.current_role() in ('pharmacist', 'admin'))
    )
  );

-- order_status_events: القراءة حسب ملكية الطلب، الإدخال للموظفين (والدوال security definer)
create policy order_status_events_select on public.order_status_events
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_events.order_id
        and (o.customer_id = auth.uid() or o.courier_id = auth.uid() or public.current_role() in ('pharmacist', 'admin'))
    )
  );
create policy order_status_events_insert_staff on public.order_status_events
  for insert with check (public.current_role() in ('pharmacist', 'admin'));

-- prescriptions
create policy prescriptions_select on public.prescriptions
  for select using (customer_id = auth.uid() or public.current_role() in ('pharmacist', 'admin'));
create policy prescriptions_insert on public.prescriptions
  for insert with check (customer_id = auth.uid());
create policy prescriptions_update_staff on public.prescriptions
  for update using (public.current_role() in ('pharmacist', 'admin'));

-- payments: قراءة فقط لصاحب الطلب أو الموظفين؛ الكتابة عن طريق service role (Edge Functions) بس
create policy payments_select on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.customer_id = auth.uid() or public.current_role() in ('pharmacist', 'admin'))
    )
  );

-- delivery_assignments
create policy delivery_assignments_select on public.delivery_assignments
  for select using (
    courier_id = auth.uid()
    or public.current_role() in ('pharmacist', 'admin')
    or exists (select 1 from public.orders o where o.id = delivery_assignments.order_id and o.customer_id = auth.uid())
  );
create policy delivery_assignments_write_staff on public.delivery_assignments
  for all using (public.current_role() in ('pharmacist', 'admin'))
  with check (public.current_role() in ('pharmacist', 'admin'));

-- courier_locations
create policy courier_locations_select on public.courier_locations
  for select using (
    courier_id = auth.uid()
    or public.current_role() in ('pharmacist', 'admin')
    or exists (select 1 from public.orders o where o.id = courier_locations.order_id and o.customer_id = auth.uid())
  );
create policy courier_locations_upsert_own on public.courier_locations
  for insert with check (courier_id = auth.uid() and public.current_role() = 'courier');
create policy courier_locations_update_own on public.courier_locations
  for update using (courier_id = auth.uid() and public.current_role() = 'courier');
