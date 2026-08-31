import type { ElhazemClient } from '../supabase/createClient'
import { mapCourierLocation, mapDeliveryAssignment, mapOrder } from '../supabase/mappers'
import type { CourierLocation, DeliveryAssignment, DeliveryAssignmentStatus, Order } from '../types'

export async function listCourierDeliveries(client: ElhazemClient, courierId: string): Promise<DeliveryAssignment[]> {
  const { data, error } = await client
    .from('delivery_assignments')
    .select('*')
    .eq('courier_id', courierId)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return data.map(mapDeliveryAssignment)
}

export async function setDeliveryStatus(
  client: ElhazemClient,
  orderId: string,
  status: DeliveryAssignmentStatus,
): Promise<Order> {
  const { data, error } = await client.rpc('courier_set_delivery_status', {
    p_order_id: orderId,
    p_status: status,
  })
  if (error) throw error
  return mapOrder(data)
}

export async function upsertCourierLocation(
  client: ElhazemClient,
  courierId: string,
  location: { orderId: string | null; lat: number; lng: number },
): Promise<void> {
  const { error } = await client.from('courier_locations').upsert({
    courier_id: courierId,
    order_id: location.orderId,
    lat: location.lat,
    lng: location.lng,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function getCourierLocation(client: ElhazemClient, courierId: string): Promise<CourierLocation | null> {
  const { data, error } = await client.from('courier_locations').select('*').eq('courier_id', courierId).maybeSingle()
  if (error) throw error
  return data ? mapCourierLocation(data) : null
}

export function subscribeToCourierLocation(
  client: ElhazemClient,
  courierId: string,
  onChange: (location: CourierLocation) => void,
) {
  const channel = client
    .channel(`courier-location-${courierId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'courier_locations', filter: `courier_id=eq.${courierId}` },
      (payload) => onChange(mapCourierLocation(payload.new as never)),
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}
