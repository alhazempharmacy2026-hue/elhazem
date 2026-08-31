# صيدلية الحازم

Monorepo فيه كل أنظمة صيدلية الحازم الرقمية:

| المجلد | الوصف |
|---|---|
| [`apps/web`](apps/web) | موقع طلب الأدوية أونلاين للعملاء (تصفح، عربة، دفع، تتبع توصيل) |
| [`apps/admin`](apps/admin) | لوحة تحكم داخلية لموظفي الصيدلية (الطلبات، المخزون، الروشتات، المناديب) |
| [`apps/mobile`](apps/mobile) | تطبيق iOS و Android (Expo/React Native) — نفس تدفقات الموقع + وضع مندوب التوصيل |
| [`apps/analytics`](apps/analytics) | أداة تحليل المبيعات الداخلية (الأداة الأصلية، بدون ربط بالباك اند الجديد) |
| [`packages/shared`](packages/shared) | منطق مشترك بين `web`/`admin`/`mobile`: الأنواع، عميل Supabase، طبقة الـ API، التحقق، التنسيق |
| [`supabase`](supabase) | سكيما قاعدة البيانات، RLS، Storage buckets، Edge Functions (Paymob، إشعارات Push) |

`web` و`admin` و`mobile` بيتبنوا على [Supabase](https://supabase.com) كباك اند كامل (قاعدة بيانات Postgres + تسجيل دخول + تخزين ملفات + تحديثات حية) — مفيش سيرفر منفصل لازم تستضيفه.

## أول مرة تشتغل على المشروع

راجع **[SETUP.md](SETUP.md)** — فيها خطوة بخطوة إزاي تنشئ مشروع Supabase، تشغّل الـ migrations، تحط المفاتيح، وتربط الدفع بـ Paymob.

## التشغيل محليًا

```bash
npm install   # بيثبت كل التطبيقات مرة واحدة (npm workspaces)

npm run dev:web         # موقع العملاء — http://localhost:5173
npm run dev:admin       # لوحة تحكم الصيدلية
npm run dev:analytics   # أداة تحليل المبيعات
npm run dev:mobile      # تطبيق الموبايل (Expo) — يفتح QR / محاكي
```

كل تطبيق محتاج ملف `.env` خاص بيه (انسخ `.env.example` الموجود في مجلده) — راجع `SETUP.md`.

## البناء للإنتاج

```bash
npm run build   # يبني web + admin + analytics
```

`apps/web` و`apps/analytics` بينشروا تلقائيًا على GitHub Pages مع كل push (راجع `.github/workflows/deploy-pages.yml`). `apps/admin` مقصود إنه يتنشر منفصل (Cloudflare Pages مثلاً) عشان يفضل بعيد عن رابط المتجر العام. `apps/mobile` بيتبني عن طريق EAS Build (راجع `.github/workflows/eas-build.yml` و`SETUP.md`).
