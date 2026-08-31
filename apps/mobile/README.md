# تطبيق موبايل صيدلية الحازم (@elhazem/mobile)

تطبيق [Expo](https://expo.dev)/React Native واحد يشتغل على iOS وAndroid من نفس الكود، لنظام
طلب الأدوية الجديد لصيدلية الحازم. التطبيق عربي بالكامل واتجاهه من اليمين لليسار (RTL).

له وضعان حسب دور المستخدم (`profiles.role` في قاعدة البيانات):

- **عميل (customer)** — الوضع الافتراضي: تصفح وبحث عن الأدوية، عربة تسوق، إتمام الطلب
  (عنوان ← صورة روشتة إذا لزم ← طريقة الدفع ← مراجعة وتأكيد)، تتبع الطلب بخريطة مباشرة،
  سجل الطلبات، والحساب.
- **مندوب توصيل (courier)** — تاب مختلف تمامًا: قائمة الطلبات المُسندة له، أزرار لتغيير حالة
  كل توصيلة (استلمت الطلب / في الطريق / تم التسليم)، ومع كل توصيلة نشطة يبعت موقعه (GPS)
  للخادم كل فترة قصيرة عشان شاشة تتبع العميل تعرض موقعه على الخريطة.

التطبيق بيتكلم مباشرة مع Supabase (قاعدة بيانات + مصادقة + تخزين ملفات + Realtime + RLS)
من غير أي سيرفر خلفي (backend) خاص بينا — ومنطق الأعمال (business logic) بالكامل جاي من
حزمة `@elhazem/shared` المشتركة مع تطبيق الويب `apps/web`.

## تشغيل المشروع محليًا

من جذر الـ monorepo، لازم يتعمل تنصيب واحد لكل الحزم (`npm install`) — ده بيحصل مرة واحدة
لكل المشروع، مش داخل مجلد `apps/mobile` بمفرده.

بعد كده، من داخل هذا المجلد:

```bash
cp .env.example .env
# عدّل .env وحط فيه EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY الحقيقيين
# (تلاقيهم في إعدادات مشروع Supabase بتاعك: Project Settings → API)

npx expo start
```

محتاج جهاز حقيقي أو محاكي (iOS Simulator على Mac، أو Android Emulator) مثبت عليه تطبيق
Expo Go، أو تشغّل build تطويري (`expo run:ios` / `expo run:android`) لو محتاج مكتبات
native زي `react-native-maps` و`react-native-webview` بشكل كامل (Expo Go بيدعمهم لكن أفضل
تجربة بتكون على development build).

## بناء نسخة iOS

بناء iOS بيتم عن طريق [EAS Build](https://docs.expo.dev/build/introduction/) — **مش محتاج
جهاز Mac**. لازم فقط:

1. حساب Expo/EAS (`eas login` بعد التسجيل على expo.dev)، وتشغيل `eas init` لربط المشروع
   وتحديث `extra.eas.projectId` في `app.config.ts`.
2. حساب Apple Developer (مدفوع، $99/سنة) عشان توقيع التطبيق ورفعه على App Store.

بعدها: `eas build --platform ios` (و`eas build --platform android` لأندرويد بنفس الطريقة
لكن من غير الحاجة لحساب Apple).

## حالة الدفع في هذه النسخة

- **الدفع عند الاستلام (Cash on Delivery)** شغّال بالكامل من أول للآخر في هذه النسخة.
- **الدفع الإلكتروني عبر Paymob** (بطاقة/محفظة) متوصّل من ناحية الكود (WebView لصفحة
  الدفع اللي بيرجعها `create-payment-intention`)، لكنه مش هيشتغل فعليًا في الإنتاج غير
  بعد ما صاحب العمل يجهز حساب تاجر (merchant account) حقيقي على Paymob ويحط مفاتيحه في
  إعدادات Supabase Edge Functions.

## نقاط مهمّة (Scope) لهذه النسخة

- تتبع موقع المندوب يشتغل في **المقدمة (foreground) فقط** — لو التطبيق راح للخلفية بيتوقف
  الإرسال. ده قرار متعمد لتبسيط النسخة الأولى (MVP)، مش خطأ.
- مفيش دعم Offline، ومفيش اختبارات آلية (automated tests)، ومفيش وضع ليلي (dark mode).
- أيقونة التطبيق وصورة splash لسه placeholders — لازم صاحب العمل يوفر تصميم حقيقي قبل أي
  بناء EAS نهائي (راجع التعليق في `app.config.ts`).
