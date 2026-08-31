import { Redirect } from 'expo-router'
import { LoadingScreen } from '../src/components/LoadingScreen'
import { useAuth } from '../src/context/AuthContext'

// نقطة الدخول: بتوجّه المستخدم حسب حالة الجلسة والدور (role) في البروفايل —
// عميل (المسار الافتراضي) أو مندوب توصيل، أو شاشة تسجيل الدخول لو مفيش جلسة.
export default function Index() {
  const { session, profile, loading } = useAuth()

  if (loading) return <LoadingScreen message="جاري التحميل..." />
  if (!session) return <Redirect href="/auth/sign-in" />
  if (!profile) return <LoadingScreen message="جاري تجهيز حسابك..." />

  if (profile.role === 'courier') {
    return <Redirect href="/(courier)/(tabs)/orders" />
  }

  // العميل هو الوضع الافتراضي (حتى لو الدور pharmacist/admin — مش مستخدم متوقع لتطبيق
  // الموبايل ده أصلاً، فبنعامله كعميل بدل ما نعمل شاشة منفصلة له)
  return <Redirect href="/(customer)/(tabs)" />
}
