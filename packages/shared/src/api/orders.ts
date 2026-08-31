import type { ElhazemClient } from '../supabase/createClient'
import { mapOrder, mapOrderItem, mapOrderStatusEvent } from '../supabase/mappers'
import type { CartItem, Order, OrderItem, OrderStatus, OrderStatusEvent, PaymentMethod } from '../types'

export interface PlaceOrderInput {
  addressId: string
  paymentMethod: PaymentMethod
  items: CartItem[]
  prescriptionId?: string | null
  deliveryFee?: number
  notes?: string | null
}

export async function placeOrder(client: ElhazemClient, input: PlaceOrderInput): Promise<Order> {
  const { data, error } = await client.rpc('create_order', {
    p_address_id: input.addressId,
    p_payment_method: input.paymentMethod,
    p_items: input.items.map((item) => ({ medicine_id: item.medicineId, quantity: item.quantity })),
    p_prescription_id: input.prescriptionId ?? null,
    p_delivery_fee: input.deliveryFee ?? 20,
    p_notes: input.notes ?? null,
  })
  if (error) throw error
  return mapOrder(data)
}

export async function listMyOrders(client: ElhazemClient, customerId: string): Promise<Order[]> {
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapOrder)
}

export async function getOrder(client: ElhazemClient, orderId: string): Promise<Order | null> {
  const { data, error } = await client.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error) throw error
  return data ? mapOrder(data) : null
}

export async function getOrderItems(client: ElhazemClient, orderId: string): Promise<OrderItem[]> {
  const { data, error } = await client.from('order_items').select('*').eq('order_id', orderId)
  if (error) throw error
  return data.map(mapOrderItem)
}

export async function getOrderStatusEvents(client: ElhazemClient, orderId: string): Promise<OrderStatusEvent[]> {
  const { data, error } = await client
    .from('order_status_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(mapOrderStatusEvent)
}

export function subscribeToOrder(client: ElhazemClient, orderId: string, onChange: (order: Order) => void) {
  const channel = client
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => onChange(mapOrder(payload.new as never)),
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

// --- لوحة تحكم الصيدلية ---

export async function listOrderQueue(client: ElhazemClient, statuses?: OrderStatus[]): Promise<Order[]> {
  let query = client.from('orders').select('*').order('created_at', { ascending: false })
  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses)
  }
  const { data, error } = await query
  if (error) throw error
  return data.map(mapOrder)
}

export async function setOrderStatus(
  client: ElhazemClient,
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<Order> {
  const { data, error } = await client.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_note: note ?? null,
  })
  if (error) throw error
  return mapOrder(data)
}

// upsert بدل insert عشان يسمح بإعادة تعيين مندوب تاني لطلب اتعين له مندوب قبل كده
// (order_id عمود unique في delivery_assignments)
export async function assignCourier(client: ElhazemClient, orderId: string, courierId: string): Promise<void> {
  const { error: assignError } = await client.from('delivery_assignments').upsert(
    { order_id: orderId, courier_id: courierId, status: 'assigned', assigned_at: new Date().toISOString(), delivered_at: null },
    { onConflict: 'order_id' },
  )
  if (assignError) throw assignError

  const { error: orderError } = await client.from('orders').update({ courier_id: courierId }).eq('id', orderId)
  if (orderError) throw orderError
}
