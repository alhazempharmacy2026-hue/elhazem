// نفس ألوان الهوية البصرية المستخدمة في أدوات الصيدلية الأخرى (apps/analytics وغيرها)
// منقولة هنا كقيم React Native (مفيش CSS variables في RN)، عشان الشكل يفضل متسق بين
// كل واجهات صيدلية الحازم.
export const colors = {
  background: '#f5f7fb',
  surface: '#ffffff',
  border: '#e6e9f0',
  text: '#1b2233',
  textMuted: '#6b7280',
  brand: '#0f9d6e',
  brandDark: '#0b7a56',
  danger: '#dc2626',
  warning: '#d97706',
  white: '#ffffff',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const

// أسماء الخطوط المسجلة عن طريق useFonts في app/_layout.tsx (حزمة @expo-google-fonts/cairo)
export const fonts = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_500Medium',
  semiBold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const

// ألوان حالة الطلب — تُستخدم مع orderStatusLabels من @elhazem/shared
export const statusColors: Record<string, string> = {
  pending_payment: colors.warning,
  placed: colors.brand,
  pharmacist_review: colors.warning,
  confirmed: colors.brand,
  preparing: colors.brand,
  out_for_delivery: colors.brandDark,
  delivered: colors.brand,
  cancelled: colors.danger,
  rejected: colors.danger,
  assigned: colors.warning,
  picked_up: colors.brand,
  en_route: colors.brandDark,
  failed: colors.danger,
}
