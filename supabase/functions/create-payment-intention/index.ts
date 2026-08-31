// Edge Function: تنشئ "نية دفع" على Paymob (Unified Intention API) وترجع رابط الدفع.
// المفتاح السري لباي موب موجود هنا بس (كـ secret) — مايتبعتش أبدًا لكود العميل.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabaseAdmin.ts'

const PAYMOB_BASE_URL = 'https://accept.paymob.com'

interface RequestBody {
  orderId: string
  paymentMethod: 'paymob_card' | 'paymob_wallet'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'مفقود Authorization header' }, { status: 401 })

    // عميل باستخدام توكن المستخدم نفسه — بيستفيد من RLS للتأكد إن الطلب فعلاً بتاعه
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return jsonResponse({ error: 'جلسة غير صالحة' }, { status: 401 })

    const { orderId, paymentMethod } = (await req.json()) as RequestBody
    if (!orderId || !paymentMethod) return jsonResponse({ error: 'orderId و paymentMethod مطلوبين' }, { status: 400 })

    const { data: order, error: orderError } = await userClient
      .from('orders')
      .select('id, customer_id, total, payment_status')
      .eq('id', orderId)
      .single()
    if (orderError || !order) return jsonResponse({ error: 'الطلب غير موجود' }, { status: 404 })
    if (order.payment_status === 'paid') return jsonResponse({ error: 'الطلب مدفوع بالفعل' }, { status: 409 })

    const secretKey = Deno.env.get('PAYMOB_SECRET_KEY')
    const publicKey = Deno.env.get('PAYMOB_PUBLIC_KEY')
    const integrationId =
      paymentMethod === 'paymob_card'
        ? Deno.env.get('PAYMOB_INTEGRATION_ID_CARD')
        : Deno.env.get('PAYMOB_INTEGRATION_ID_WALLET')
    const notificationUrl = Deno.env.get('PAYMOB_WEBHOOK_URL')
    const redirectionUrl = Deno.env.get('PAYMOB_REDIRECT_URL')

    if (!secretKey || !publicKey || !integrationId) {
      return jsonResponse(
        { error: 'إعدادات Paymob ناقصة — راجع secrets: PAYMOB_SECRET_KEY / PAYMOB_PUBLIC_KEY / PAYMOB_INTEGRATION_ID_*' },
        { status: 500 },
      )
    }

    const {
      data: { user: userDetails },
    } = await userClient.auth.getUser()

    const intentionResponse = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
      method: 'POST',
      headers: { Authorization: `Token ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: Math.round(Number(order.total) * 100),
        currency: 'EGP',
        payment_methods: [Number(integrationId)],
        special_reference: order.id,
        notification_url: notificationUrl,
        redirection_url: redirectionUrl,
        billing_data: {
          apartment: 'NA',
          floor: 'NA',
          building: 'NA',
          street: 'NA',
          city: 'NA',
          country: 'EG',
          state: 'NA',
          email: userDetails?.email ?? 'customer@elhazem.pharmacy',
          phone_number: userDetails?.phone || '+201000000000',
          first_name: (userDetails?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'عميل',
          last_name: (userDetails?.user_metadata?.full_name as string | undefined)?.split(' ').slice(1).join(' ') || 'الحازم',
        },
      }),
    })

    if (!intentionResponse.ok) {
      const errorBody = await intentionResponse.text()
      console.error('Paymob intention error', errorBody)
      return jsonResponse({ error: 'فشل إنشاء عملية الدفع مع Paymob' }, { status: 502 })
    }

    const intention = (await intentionResponse.json()) as { client_secret: string; id: string }

    const admin = createSupabaseAdminClient()
    await admin.from('payments').insert({
      order_id: order.id,
      provider: 'paymob',
      paymob_order_id: intention.id,
      amount: order.total,
      status: 'initiated',
    })

    const checkoutUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${intention.client_secret}`

    return jsonResponse({ checkoutUrl, paymobOrderId: intention.id })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'خطأ غير متوقع' }, { status: 500 })
  }
})
