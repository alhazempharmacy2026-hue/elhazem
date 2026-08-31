// Edge Function: تبعت إشعار Push للعميل عند تغيّر حالة طلبه.
// اتصميمها تتنادى بطريقتين: (أ) مباشرة بـ { orderId } من أي مكان في الكود، أو (ب) عن طريق
// ربطها كـ Database Webhook على `orders` (UPDATE) من Supabase Dashboard → Database → Webhooks،
// وفي الحالة دي بيوصلها payload بشكل { type: 'UPDATE', table: 'orders', record: {...} }.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabaseAdmin.ts'

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'بانتظار الدفع',
  placed: 'تم استلام طلبك',
  pharmacist_review: 'الروشتة تحت المراجعة',
  confirmed: 'تم تأكيد طلبك',
  preparing: 'جاري تجهيز طلبك',
  out_for_delivery: 'طلبك في الطريق إليك',
  delivered: 'تم تسليم طلبك',
  cancelled: 'تم إلغاء طلبك',
  rejected: 'تم رفض طلبك',
}

interface DbWebhookPayload {
  type?: string
  table?: string
  record?: { id: string; customer_id: string; status: string }
}

interface DirectPayload {
  orderId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = (await req.json()) as DbWebhookPayload & DirectPayload
    const admin = createSupabaseAdminClient()

    let orderId = body.orderId
    let customerId: string | undefined
    let status: string | undefined

    if (body.record) {
      orderId = body.record.id
      customerId = body.record.customer_id
      status = body.record.status
    } else if (orderId) {
      const { data: order } = await admin.from('orders').select('customer_id, status').eq('id', orderId).single()
      customerId = order?.customer_id
      status = order?.status
    }

    if (!customerId || !status) return jsonResponse({ error: 'orderId أو record ناقص' }, { status: 400 })

    const { data: profile } = await admin.from('profiles').select('expo_push_token').eq('id', customerId).maybeSingle()
    if (!profile?.expo_push_token) return jsonResponse({ skipped: 'no push token' })

    const statusLabel = ORDER_STATUS_LABELS[status] ?? status
    const orderNumber = `#${orderId.slice(0, 8).toUpperCase()}`

    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify([
        {
          to: profile.expo_push_token,
          title: 'صيدلية الحازم',
          body: `طلبك ${orderNumber}: ${statusLabel}`,
          data: { orderId },
          sound: 'default',
        },
      ]),
    })

    if (!pushResponse.ok) {
      console.error('Expo push send failed', await pushResponse.text())
      return jsonResponse({ error: 'فشل إرسال الإشعار' }, { status: 502 })
    }

    return jsonResponse({ sent: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'خطأ غير متوقع' }, { status: 500 })
  }
})
