import AsyncStorage from '@react-native-async-storage/async-storage'
import { createElhazemClient, type ElhazemClient } from '@elhazem/shared'

// Expo بيحقن أي متغير بيئة اسمه بادئته EXPO_PUBLIC_ في process.env وقت الـ build تلقائيًا،
// فمش محتاجين أي مكتبة إضافية زي dotenv هنا.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// AsyncStorage بيتوافق مع شكل AuthStorageAdapter المطلوب من @elhazem/shared (getItem/setItem/removeItem)
// بدون أي تعديل. اخترنا AsyncStorage بدل expo-secure-store لتخزين جلسة supabase لأن SecureStore
// عنده حد أقصى ~2048 بايت للقيمة الواحدة على iOS، وممكن جلسة supabase (access+refresh token) تتخطى
// كده وتتقطع بصمت — AsyncStorage مفهوش الحد ده وهو الموصى به رسميًا من supabase-js لتطبيقات RN.
export const supabase: ElhazemClient | null = isSupabaseConfigured
  ? createElhazemClient({
      url: supabaseUrl as string,
      anonKey: supabaseAnonKey as string,
      storage: AsyncStorage,
    })
  : null

export const supabaseConfigErrorMessage =
  'التطبيق مش متظبط: متغيرات EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY غير موجودة. ' +
  'راجع ملف .env.example وأنشئ ملف .env بمفاتيح مشروع Supabase الحقيقي، بعدين أعد تشغيل expo start.'
