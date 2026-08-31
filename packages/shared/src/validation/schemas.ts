import { z } from 'zod'

export const egyptianPhoneSchema = z
  .string()
  .regex(/^01[0125][0-9]{8}$/, 'رقم الموبايل لازم يبدأ بـ 010/011/012/015 ويكون ١١ رقم')

export const emailSchema = z.string().email('الإيميل غير صحيح')
export const passwordSchema = z.string().min(6, 'كلمة المرور لازم تكون ٦ حروف على الأقل')

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'الاسم قصير جدًا'),
  email: emailSchema,
  password: passwordSchema,
  phone: egyptianPhoneSchema,
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'اكتب كلمة المرور'),
})

export const addressSchema = z.object({
  label: z.string().min(1, 'اسم العنوان مطلوب (مثلاً: المنزل)'),
  governorate: z.string().min(1, 'المحافظة مطلوبة'),
  city: z.string().min(1, 'المدينة/المركز مطلوب'),
  street: z.string().min(1, 'الشارع مطلوب'),
  building: z.string().min(1, 'رقم العمارة مطلوب'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  isDefault: z.boolean().optional(),
})

export const checkoutSchema = z.object({
  addressId: z.string().uuid('اختار عنوان التوصيل'),
  paymentMethod: z.enum(['paymob_card', 'paymob_wallet', 'cash_on_delivery']),
  prescriptionId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
