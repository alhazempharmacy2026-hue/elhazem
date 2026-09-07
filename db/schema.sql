-- صيدلية الحازم — جداول المخزون والمشتريات (Supabase / Postgres)
-- شغّل الملف ده مرة واحدة بس من Supabase Dashboard > SQL Editor > New query > Run

create table if not exists items (
  id text primary key,
  name text not null,
  code text,
  unit text,
  category text,
  current_stock numeric not null default 0,
  min_stock numeric not null default 0,
  purchase_price numeric,
  sale_price numeric,
  supplier_id text,
  updated_at date not null default current_date,
  avg_daily_sales numeric,
  sales_period_days integer,
  order_status text,
  order_status_at date
);

create table if not exists suppliers (
  id text primary key,
  name text not null,
  phone text,
  notes text
);

create table if not exists supplier_transactions (
  id text primary key,
  supplier_id text not null,
  date date not null,
  type text not null,
  amount numeric not null,
  note text
);

create table if not exists emergency_purchases (
  id text primary key,
  date date not null,
  item_id text,
  item_name text not null,
  source_pharmacy text,
  quantity numeric,
  public_price numeric,
  cost_price numeric,
  note text
);

create index if not exists items_code_idx on items (code);
create index if not exists supplier_transactions_supplier_idx on supplier_transactions (supplier_id);

-- الموقع ثابت (static) ومفيهوش تسجيل دخول، فمفتاح anon هو نفسه اللي بيقرا ويكتب.
-- الحماية هنا مش بإخفاء المفتاح (بيبقى ظاهر في كود الموقع بطبيعته) لكن بإن الجداول
-- دي مش فيها بيانات حساسة زي كلمات سر أو بيانات دفع.
alter table items enable row level security;
alter table suppliers enable row level security;
alter table supplier_transactions enable row level security;
alter table emergency_purchases enable row level security;

create policy "allow all - items" on items for all using (true) with check (true);
create policy "allow all - suppliers" on suppliers for all using (true) with check (true);
create policy "allow all - supplier_transactions" on supplier_transactions for all using (true) with check (true);
create policy "allow all - emergency_purchases" on emergency_purchases for all using (true) with check (true);
