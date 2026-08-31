-- Storage buckets: صور الروشتات (خاصة) وصور الأدوية (قراءة عامة).

insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false), ('medicine-images', 'medicine-images', true)
on conflict (id) do nothing;

-- prescriptions: المسار المتوقع هو `<customer_id>/<file>.jpg` — العميل يقرأ/يكتب مساره بس، الموظف يقرأ الكل
create policy prescriptions_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = auth.uid()::text);

create policy prescriptions_bucket_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'prescriptions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.current_role() in ('pharmacist', 'admin'))
  );

-- medicine-images: قراءة عامة (المتجر عرض عام)، الكتابة للموظفين بس
create policy medicine_images_bucket_select on storage.objects
  for select using (bucket_id = 'medicine-images');

create policy medicine_images_bucket_write on storage.objects
  for all to authenticated
  using (bucket_id = 'medicine-images' and public.current_role() in ('pharmacist', 'admin'))
  with check (bucket_id = 'medicine-images' and public.current_role() in ('pharmacist', 'admin'));
