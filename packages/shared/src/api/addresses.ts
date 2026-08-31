import type { ElhazemClient } from '../supabase/createClient'
import { mapAddress } from '../supabase/mappers'
import type { Address } from '../types'

export async function listAddresses(client: ElhazemClient, customerId: string): Promise<Address[]> {
  const { data, error } = await client
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
  if (error) throw error
  return data.map(mapAddress)
}

export type NewAddress = Omit<Address, 'id' | 'createdAt' | 'customerId'>

export async function createAddress(client: ElhazemClient, customerId: string, input: NewAddress): Promise<Address> {
  const { data, error } = await client
    .from('addresses')
    .insert({
      customer_id: customerId,
      label: input.label,
      governorate: input.governorate,
      city: input.city,
      street: input.street,
      building: input.building,
      floor: input.floor,
      apartment: input.apartment,
      landmark: input.landmark,
      lat: input.lat,
      lng: input.lng,
      is_default: input.isDefault,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapAddress(data)
}

export async function deleteAddress(client: ElhazemClient, id: string): Promise<void> {
  const { error } = await client.from('addresses').delete().eq('id', id)
  if (error) throw error
}
