-- سكيما نظام طلب الأدوية أونلاين لصيدلية الحازم.
-- يعتمد على auth.users المدمج في Supabase؛ profiles.id يشير إليه مباشرة.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text unique,
  role text not null default 'customer' check (role in ('customer', 'pharmacist', 'admin', 'courier')),
  expo_push_token text,
  created_at timestamptz not null default now()
);

-- إنشاء صف profiles تلقائيًا عند تسجيل مستخدم جديد
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  governorate text not null,
  city text not null,
  street text not null,
  building text not null,
  floor text,
  apartment text,
  landmark text,
  lat numeric,
  lng numeric,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_customer_id_idx on public.addresses (customer_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  slug text not null unique,
  sort_order int not null default 0
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  description_ar text,
  category_id uuid references public.categories (id) on delete set null,
  sku text unique,
  manufacturer text,
  price numeric(10, 2) not null check (price >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  requires_prescription boolean not null default false,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medicines_category_id_idx on public.medicines (category_id);
create index medicines_active_idx on public.medicines (active) where active = true;

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid, -- يُربط لاحقًا بعد إنشاء الطلب (FK تُضاف بعد إنشاء جدول orders)
  image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewer_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index prescriptions_customer_id_idx on public.prescriptions (customer_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id),
  address_id uuid not null references public.addresses (id),
  status text not null default 'placed' check (
    status in (
      'pending_payment', 'placed', 'pharmacist_review', 'confirmed',
      'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'
    )
  ),
  payment_method text not null check (payment_method in ('paymob_card', 'paymob_wallet', 'cash_on_delivery')),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')
  ),
  subtotal numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  prescription_id uuid references public.prescriptions (id),
  courier_id uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_courier_id_idx on public.orders (courier_id);
create index orders_status_idx on public.orders (status);

alter table public.prescriptions
  add constraint prescriptions_order_id_fkey foreign key (order_id) references public.orders (id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id),
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null
);
create index order_items_order_id_idx on public.order_items (order_id);

create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index order_status_events_order_id_idx on public.order_status_events (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'paymob',
  paymob_order_id text,
  paymob_transaction_id text,
  amount numeric(10, 2) not null,
  status text not null default 'initiated' check (
    status in ('initiated', 'pending', 'success', 'failed', 'refunded')
  ),
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_id_idx on public.payments (order_id);

create table public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  courier_id uuid not null references public.profiles (id),
  status text not null default 'assigned' check (
    status in ('assigned', 'picked_up', 'en_route', 'delivered', 'failed')
  ),
  assigned_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index delivery_assignments_courier_id_idx on public.delivery_assignments (courier_id);

-- صف واحد لكل مندوب (آخر موقع معروف)، بيتحدّث بالـ upsert بدل الإضافة — يكفي MVP للتتبع الحي
create table public.courier_locations (
  courier_id uuid primary key references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id),
  lat numeric not null,
  lng numeric not null,
  updated_at timestamptz not null default now()
);
