// Edge Function: بتستقبل Paymob transaction-processed callback، تتحقق من توقيع HMAC،
// وتحدّث orders/payments حسب نتيجة الدفع. الرابط ده هو اللي بتحطه في PAYMOB_WEBHOOK_URL
// وفي إعدادات الـ Integration على لوحة تحكم Paymob.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabaseAdmin.ts'

// ترتيب الحقول ده محدد من مستندات Paymob لـ "Transaction Processed Callback" — لازم يفضل
// بنفس الترتيب ده بالظبط عشان الـ HMAC يتطابق. راجع مستندات Paymob الحالية لو غيّروه.
const HMAC_FIELD_ORDER = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], obj)
}

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const body = (await req.json()) as { obj?: Record<string, unknown> }
    const obj = body.obj
    if (!obj) return jsonResponse({ error: 'payload غير متوقع' }, { status: 400 })

    const providedHmac = url.searchParams.get('hmac') ?? ''
    const secret = Deno.env.get('PAYMOB_HMAC_SECRET')
    if (!secret) return jsonResponse({ error: 'PAYMOB_HMAC_SECRET غير مضبوط' }, { status: 500 })

    const message = HMAC_FIELD_ORDER.map((field) => String(getByPath(obj, field) ?? '')).join('')
    const computedHmac = await hmacSha512Hex(secret, message)

    if (computedHmac !== providedHmac) {
      console.error('Paymob HMAC mismatch')
      return jsonResponse({ error: 'توقيع غير صالح' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const paymobOrderId = String((obj.order as { id?: unknown } | undefined)?.id ?? '')
    const success = obj.success === true

    const { data: payment } = await admin
      .from('payments')
      .select('id, order_id')
      .eq('paymob_order_id', paymobOrderId)
      .maybeSingle()

    if (!payment) {
      console.error('No matching payment row for paymob order', paymobOrderId)
      return jsonResponse({ received: true })
    }

    await admin
      .from('payments')
      .update({
        status: success ? 'success' : 'failed',
        paymob_transaction_id: String(obj.id ?? ''),
        raw_webhook_payload: obj,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (success) {
      const { data: items } = await admin
        .from('order_items')
        .select('medicine_id, medicines(requires_prescription)')
        .eq('order_id', payment.order_id)

      const requiresPrescription = (items ?? []).some(
        (item) => (item as unknown as { medicines: { requires_prescription: boolean } }).medicines?.requires_prescription,
      )
      const nextStatus = requiresPrescription ? 'pharmacist_review' : 'placed'

      await admin
        .from('orders')
        .update({ payment_status: 'paid', status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', payment.order_id)

      await admin.from('order_status_events').insert({
        order_id: payment.order_id,
        status: nextStatus,
        note: 'تم تأكيد الدفع عن طريق Paymob',
      })
    } else {
      await admin
        .from('orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.order_id)
    }

    return jsonResponse({ received: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'خطأ غير متوقع' }, { status: 500 })
  }
})
