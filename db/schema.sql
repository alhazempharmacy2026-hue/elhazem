-- صيدلية الحازم — جداول المخزون والمشتريات (Supabase / Postgres)
-- شغّل الملف ده مرة واحدة بس من Supabase Dashboard > SQL Editor > New query > Run

create table if not exists daily_records (
  id text primary key,
  date date not null,
  invoice_count numeric,
  delivery_count numeric,
  cash_count numeric,
  cash_pay_count numeric,
  cash_value numeric,
  non_cash_count numeric,
  non_cash_value numeric,
  credit_count numeric,
  credit_value numeric,
  pending_count numeric,
  pending_value numeric,
  total_sales numeric,
  avg_invoice numeric,
  invoices_with_code numeric,
  invoices_without_code numeric,
  new_codes numeric,
  invoices_over_1000 numeric,
  invoices_500_to_1000 numeric,
  invoices_300_to_500 numeric,
  invoices_200_to_300 numeric,
  invoices_100_to_200 numeric,
  invoices_under_100 numeric,
  net_profit numeric,
  peak_hour text,
  unique_customers numeric,
  pharmacy_purchase_invoices numeric,
  weak_discount_items numeric,
  pharmacy_purchase_public_price numeric,
  profit_percent numeric,
  delivery_ratio numeric,
  purchase_to_sale_ratio numeric,
  avg_profit_per_invoice numeric,
  slimming_injections numeric,
  inbody_sessions numeric,
  returns_count numeric,
  returns_value numeric
);

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

create unique index if not exists daily_records_date_idx on daily_records (date);
create index if not exists items_code_idx on items (code);
create index if not exists supplier_transactions_supplier_idx on supplier_transactions (supplier_id);

-- الموقع ثابت (static) ومفيهوش تسجيل دخول، فمفتاح anon هو نفسه اللي بيقرا ويكتب.
-- الحماية هنا مش بإخفاء المفتاح (بيبقى ظاهر في كود الموقع بطبيعته) لكن بإن الجداول
-- دي مش فيها بيانات حساسة زي كلمات سر أو بيانات دفع.
alter table daily_records enable row level security;
alter table items enable row level security;
alter table suppliers enable row level security;
alter table supplier_transactions enable row level security;
alter table emergency_purchases enable row level security;

create policy "allow all - daily_records" on daily_records for all using (true) with check (true);
create policy "allow all - items" on items for all using (true) with check (true);
create policy "allow all - suppliers" on suppliers for all using (true) with check (true);
create policy "allow all - supplier_transactions" on supplier_transactions for all using (true) with check (true);
create policy "allow all - emergency_purchases" on emergency_purchases for all using (true) with check (true);
