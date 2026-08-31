# دليل التشغيل الفعلي لنظام الطلب أونلاين

الكود كله جاهز وكامل (موقع، لوحة تحكم، تطبيق موبايل، باك اند)، لكن محتاج منك الخطوات دي عشان يشتغل فعليًا بدل ما يفضل مجرد كود. خليك مرتب واعمل الخطوات بالترتيب.

## ١. إنشاء مشروع Supabase (الأساس اللي كل حاجة تانية بتعتمد عليه)

1. سجّل في [supabase.com](https://supabase.com) واعمل **New Project** (اختار كلمة مرور قوية لقاعدة البيانات واحفظها).
2. من **Project Settings → API** هتلاقي:
   - `Project URL` → `VITE_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → متتحطش في أي `.env` تطبيق؛ دي بتُستخدم في Edge Functions بس (Supabase بيحقنها تلقائيًا).
3. ثبّت [Supabase CLI](https://supabase.com/docs/guides/cli) على جهازك، وسجّل دخول:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <project-ref-من-إعدادات-المشروع>
   ```
4. طبّق السكيما والـ RLS والـ RPCs الجاهزين في `supabase/migrations/`:
   ```bash
   supabase db push
   ```
   ده هيعمل كل الجداول، الصلاحيات (RLS)، الدوال (`create_order`, `set_order_status`, `courier_set_delivery_status`)، والبيانات التجريبية (تصنيفات وأدوية تجريبية — احذفها لاحقًا من لوحة التحكم وحط كتالوجك الحقيقي).
5. من **Storage** تأكد إن الـ buckets `prescriptions` و`medicine-images` اتعملوا (الـ migration بتعملهم تلقائيًا، بس اتأكد).

## ٢. إنشاء أول حساب موظف (Admin)

النظام مايسمحش بتسجيل موظفين بنفسهم (لأمان الصيدلية) — أول حساب admin بتعمله يدويًا:

1. سجّل حساب عادي (عميل) من `apps/web` أو من **Authentication** في لوحة Supabase.
2. من **SQL Editor** في Supabase شغّل:
   ```sql
   update public.profiles set role = 'admin' where id = '<user-id-بتاعك>';
   ```
3. دلوقتي تقدر تدخل `apps/admin` بنفس الإيميل وكلمة المرور دي. حسابات الصيادلة/المناديب الإضافية اعملها بنفس الطريقة (`role = 'pharmacist'` أو `'courier'`).

## ٣. ربط كل تطبيق بمفاتيحك

انسخ كل ملف `.env.example` لـ `.env` في نفس المجلد وحط القيم من خطوة ١:

- `apps/web/.env`
- `apps/admin/.env`
- `apps/mobile/.env`

## ٤. تفعيل الدفع الإلكتروني (Paymob) — اختياري، النظام شغال بـ"الدفع عند الاستلام" من غيره

1. اعمل حساب تاجر على [Paymob](https://paymob.com) وخلّص إجراءات الـ KYC بتاعتهم.
2. من لوحة Paymob جيب: Secret Key، Public Key، أرقام الـ Integration بتاعة الكارت والمحفظة، وHMAC Secret.
3. انشر الـ Edge Functions:
   ```bash
   supabase functions deploy create-payment-intention
   supabase functions deploy paymob-webhook
   supabase functions deploy send-order-push
   ```
4. انسخ `supabase/functions/.env.example` لـ `supabase/functions/.env`، احط المفاتيح، وارفعها:
   ```bash
   supabase secrets set --env-file supabase/functions/.env
   ```
5. حط رابط `paymob-webhook` (بعد النشر هتلاقيه في مخرجات الأمر أو في Supabase Dashboard → Edge Functions) في إعدادات الـ Webhook على لوحة Paymob نفسها.

## ٥. خرائط تتبع التوصيل — اختياري

بدون مفتاح، شاشة التتبع بتستخدم ستايل خريطة عام (تغطية محدودة). لو عايز خريطة أدق، اعمل حساب في [MapTiler](https://maptiler.com) أو مزوّد مشابه، وحط رابط الـ style بتاعك في `VITE_MAP_STYLE_URL` (وما يعادلها لموبايل لو حبيت تستخدم نفس المزوّد هناك كمان).

## ٦. نشر تطبيقات الموبايل (iOS + Android)

1. اعمل حساب مجاني على [expo.dev](https://expo.dev) وجيب `EXPO_TOKEN` (Access Token) من إعدادات حسابك، وحطه في **GitHub → Settings → Secrets → Actions** باسم `EXPO_TOKEN` (وكمان `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
2. من مجلد `apps/mobile` شغّل `eas login` ثم `eas build:configure` أول مرة (بيعمل `eas.json` لو مش موجود).
3. لبناء تجريبي (بدون نشر فعلي على المتاجر): شغّل الـ workflow `EAS Build (mobile)` يدويًا من تبويب **Actions** على GitHub، أو محليًا: `eas build --platform all --profile preview`.
4. للنشر الفعلي على المتاجر لازم:
   - **Apple Developer Program** (اشتراك سنوي مدفوع) — لـ iOS.
   - **Google Play Console** (رسوم مرة واحدة) — لـ Android.
   - بعد ما تجيبهم، `eas submit --platform ios` / `eas submit --platform android` من `apps/mobile`.

## ٧. النشر

- `apps/web` و`apps/analytics` بينشروا تلقائيًا على GitHub Pages مع كل push على البرانش الرئيسي (لازم تضيف الـ Secrets `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` في GitHub Actions Secrets عشان البناء يطلع بمفاتيح حقيقية).
- `apps/admin` انصح تنشره منفصل (Cloudflare Pages / Netlify) بدل ما يكون على نفس دومين المتجر العام — مش لازم يكون عام الوصول أو مرتبط من الموقع.

## ملخص سريع لكل الحسابات المطلوبة منك

| الحساب | ليه | مطلوب فعليًا؟ |
|---|---|---|
| Supabase | الباك اند كله | ✅ أساسي |
| Paymob | دفع أونلاين | اختياري (COD شغال من غيره) |
| MapTiler أو مشابه | دقة خريطة التتبع | اختياري |
| Expo/EAS | بناء تطبيق الموبايل | ✅ لو محتاج تبني/تنشر الموبايل |
| Apple Developer | نشر iOS | ✅ لو محتاج تنشر على App Store |
| Google Play Console | نشر Android | ✅ لو محتاج تنشر على Play Store |
