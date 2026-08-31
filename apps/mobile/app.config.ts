import type { ExpoConfig } from 'expo/config'

// ملاحظة: أيقونة التطبيق (icon.png)، صورة splash (splash.png)، وأيقونة adaptive
// لأندرويد (adaptive-icon.png) لازم تتحط فعليًا في مجلد assets/ قبل أي بناء EAS —
// المسارات هنا بتشاور على الأماكن المتعارف عليها بس الملفات نفسها لسه مش موجودة.
const config: ExpoConfig = {
  name: 'صيدلية الحازم',
  slug: 'elhazem-pharmacy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // يستخدم للرجوع للتطبيق بعد إعادة توجيه Paymob من الـ WebView (مثال: elhazem://payment-callback)
  scheme: 'elhazem',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#f5f7fb',
  },
  assetBundlePatterns: ['**/*'],
  // دعم العربي/RTL بيتم فعليًا عن طريق I18nManager.forceRTL(true) وقت التشغيل (راجع app/_layout.tsx)
  // — مفيش خاصية "supportsRTL" في سكيما إعدادات Expo نفسها.
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.elhazem.pharmacy',
    infoPlist: {
      NSCameraUsageDescription: 'التطبيق يحتاج الكاميرا لتصوير الروشتة الطبية عند الحاجة لها.',
      NSPhotoLibraryUsageDescription: 'التطبيق يحتاج الوصول للصور لرفع صورة الروشتة الطبية.',
      NSLocationWhenInUseUsageDescription:
        'تطبيق المندوب يحتاج موقعك أثناء الاستخدام عشان يقدر يظهر موقع التوصيل الحالي للعميل.',
    },
  },
  android: {
    package: 'com.elhazem.pharmacy',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#f5f7fb',
    },
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'تطبيق المندوب يحتاج موقعك أثناء الاستخدام عشان يقدر يظهر موقع التوصيل الحالي للعميل.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'التطبيق يحتاج الوصول للصور لرفع صورة الروشتة الطبية.',
        cameraPermission: 'التطبيق يحتاج الكاميرا لتصوير الروشتة الطبية عند الحاجة لها.',
      },
    ],
    'expo-font',
  ],
  extra: {
    eas: {
      // TODO: يتحط هنا الـ projectId الحقيقي بعد ربط المشروع بحساب Expo/EAS الخاص بصاحب العمل
      // (عن طريق `eas init`) — لازم قبل أي بناء EAS أو استخدام إشعارات Push حقيقية.
      projectId: 'REPLACE_WITH_EAS_PROJECT_ID',
    },
  },
}

export default config
