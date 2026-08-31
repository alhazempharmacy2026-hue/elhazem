-- بيانات تجريبية أولية (تصنيفات + أدوية) عشان الموقع/التطبيق يبقى فيه حاجة تتعرض فور ربط المشروع.
-- احذف أو عدّل دي بمجرد ما تدخل كتالوج الصيدلية الحقيقي من لوحة التحكم.

insert into public.categories (name_ar, slug, sort_order) values
  ('مسكنات وخافضات حرارة', 'pain-relief', 1),
  ('فيتامينات ومكملات', 'vitamins', 2),
  ('أدوية البرد والانفلونزا', 'cold-flu', 3),
  ('العناية بالبشرة', 'skincare', 4),
  ('أدوية مزمنة', 'chronic', 5)
on conflict (slug) do nothing;

insert into public.medicines (name_ar, name_en, description_ar, category_id, sku, manufacturer, price, stock_quantity, requires_prescription, active)
select 'بانادول اكسترا', 'Panadol Extra', 'مسكن وخافض حرارة، ٢٤ قرص', c.id, 'MED-001', 'GSK', 25.00, 200, false, true
from public.categories c where c.slug = 'pain-relief'
union all
select 'فيروجلوبين كبسول', 'Feroglobin', 'مكمل حديد وفيتامينات، ٣٠ كبسولة', c.id, 'MED-002', 'Vitabiotics', 180.00, 80, false, true
from public.categories c where c.slug = 'vitamins'
union all
select 'كونجستال', 'Congestal', 'أقراص لأعراض البرد والانفلونزا، ٢٠ قرص', c.id, 'MED-003', 'Sigma', 30.00, 150, false, true
from public.categories c where c.slug = 'cold-flu'
union all
select 'أوجمنتين ١ جم', 'Augmentin 1g', 'مضاد حيوي، ١٤ قرص — يستلزم روشتة', c.id, 'MED-004', 'GSK', 95.00, 60, true, true
from public.categories c where c.slug = 'chronic'
union all
select 'سيتافيل مويستشرايزر', 'Cetaphil Moisturizer', 'كريم ترطيب للبشرة الحساسة، ٢٥٠ مل', c.id, 'MED-005', 'Galderma', 350.00, 40, false, true
from public.categories c where c.slug = 'skincare'
on conflict (sku) do nothing;
