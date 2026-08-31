-- دوال RPC تُنفَّذ كـ security definer عشان تضمن عمليات ذرية (إنشاء طلب + عناصره + خصم المخزون
-- في معاملة واحدة) وتتحقق من الصلاحيات داخليًا بدل الاعتماد على RLS المباشر على كل جدول.

-- إنشاء طلب جديد: يتحقق من العنوان والروشتة (لو الصنف محتاجها)، يحسب الإجمالي، يخصم المخزون،
-- ويرجع صف الطلب الناتج. p_items هيكله: [{"medicine_id": "...", "quantity": 2}, ...]
create function public.create_order(
  p_address_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_prescription_id uuid default null,
  p_delivery_fee numeric default 20.00,
  p_notes text default null
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_customer_id uuid := auth.uid();
  v_subtotal numeric := 0;
  v_requires_rx boolean := false;
  v_status text;
  v_order_id uuid;
  v_order public.orders;
  v_item record;
  v_medicine record;
begin
  if v_customer_id is null then
    raise exception 'لازم تسجل دخول الأول';
  end if;

  if not exists (select 1 from public.addresses where id = p_address_id and customer_id = v_customer_id) then
    raise exception 'العنوان غير موجود أو مش تابع لحسابك';
  end if;

  if p_prescription_id is not null
     and not exists (select 1 from public.prescriptions where id = p_prescription_id and customer_id = v_customer_id) then
    raise exception 'الروشتة غير موجودة أو مش تابعة لحسابك';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'العربة فاضية';
  end if;

  -- تمريرة أولى: تحقق من التوفر والسعر واحتساب الإجمالي (مع قفل صفوف المخزون)
  for v_item in select * from jsonb_to_recordset(p_items) as x(medicine_id uuid, quantity int)
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'كمية غير صحيحة';
    end if;

    select id, price, stock_quantity, requires_prescription, active
      into v_medicine
      from public.medicines
      where id = v_item.medicine_id
      for update;

    if not found or v_medicine.active = false then
      raise exception 'صنف غير متاح: %', v_item.medicine_id;
    end if;
    if v_medicine.stock_quantity < v_item.quantity then
      raise exception 'الكمية المطلوبة غير متوفرة في المخزون لصنف %', v_item.medicine_id;
    end if;
    if v_medicine.requires_prescription then
      v_requires_rx := true;
      if p_prescription_id is null then
        raise exception 'لازم ترفع روشتة عشان صنف محتاج وصفة طبية';
      end if;
    end if;

    v_subtotal := v_subtotal + (v_medicine.price * v_item.quantity);
  end loop;

  v_status := case
    when p_payment_method <> 'cash_on_delivery' then 'pending_payment'
    when v_requires_rx then 'pharmacist_review'
    else 'placed'
  end;

  insert into public.orders (
    customer_id, address_id, status, payment_method, payment_status,
    subtotal, delivery_fee, total, prescription_id, notes
  ) values (
    v_customer_id, p_address_id, v_status, p_payment_method, 'unpaid',
    v_subtotal, p_delivery_fee, v_subtotal + p_delivery_fee, p_prescription_id, p_notes
  ) returning id into v_order_id;

  -- تمريرة تانية: تسجيل عناصر الطلب وخصم المخزون فعليًا
  for v_item in select * from jsonb_to_recordset(p_items) as x(medicine_id uuid, quantity int)
  loop
    select price into v_medicine from public.medicines where id = v_item.medicine_id;

    insert into public.order_items (order_id, medicine_id, quantity, unit_price, line_total)
    values (v_order_id, v_item.medicine_id, v_item.quantity, v_medicine.price, v_medicine.price * v_item.quantity);

    update public.medicines
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_item.medicine_id;
  end loop;

  if p_prescription_id is not null then
    update public.prescriptions set order_id = v_order_id where id = p_prescription_id;
  end if;

  insert into public.order_status_events (order_id, status, note, created_by)
  values (v_order_id, v_status, 'تم إنشاء الطلب', v_customer_id);

  select * into v_order from public.orders where id = v_order_id;
  return v_order;
end;
$$;

revoke all on function public.create_order(uuid, text, jsonb, uuid, numeric, text) from public;
grant execute on function public.create_order(uuid, text, jsonb, uuid, numeric, text) to authenticated;

-- تغيير حالة الطلب (لوحة تحكم الصيدلية بس)
create function public.set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_order public.orders;
begin
  if public.current_role() not in ('pharmacist', 'admin') then
    raise exception 'مش مسموح — الصلاحية دي للموظفين بس';
  end if;

  update public.orders set status = p_status, updated_at = now()
    where id = p_order_id
    returning * into v_order;

  if not found then
    raise exception 'الطلب غير موجود';
  end if;

  insert into public.order_status_events (order_id, status, note, created_by)
  values (p_order_id, p_status, p_note, auth.uid());

  return v_order;
end;
$$;

revoke all on function public.set_order_status(uuid, text, text) from public;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;

-- تحديث حالة التسليم من المندوب — بيعكسها تلقائيًا على حالة الطلب العامة
create function public.courier_set_delivery_status(p_order_id uuid, p_status text)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_mapped_status text;
begin
  if not exists (
    select 1 from public.delivery_assignments
    where order_id = p_order_id and courier_id = auth.uid()
  ) then
    raise exception 'الطلب ده مش متكلف بيه';
  end if;

  if p_status not in ('picked_up', 'en_route', 'delivered', 'failed') then
    raise exception 'حالة غير معروفة: %', p_status;
  end if;

  update public.delivery_assignments
    set status = p_status,
        delivered_at = case when p_status = 'delivered' then now() else delivered_at end
    where order_id = p_order_id;

  v_mapped_status := case p_status
    when 'picked_up' then 'out_for_delivery'
    when 'en_route' then 'out_for_delivery'
    when 'delivered' then 'delivered'
    when 'failed' then 'confirmed'
  end;

  update public.orders set status = v_mapped_status, updated_at = now()
    where id = p_order_id
    returning * into v_order;

  insert into public.order_status_events (order_id, status, note, created_by)
  values (p_order_id, v_mapped_status, 'تحديث من المندوب: ' || p_status, auth.uid());

  return v_order;
end;
$$;

revoke all on function public.courier_set_delivery_status(uuid, text) from public;
grant execute on function public.courier_set_delivery_status(uuid, text) to authenticated;
