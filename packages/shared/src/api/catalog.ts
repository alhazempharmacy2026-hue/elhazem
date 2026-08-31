import type { ElhazemClient } from '../supabase/createClient'
import { mapCategory, mapMedicine } from '../supabase/mappers'
import type { Category, Medicine } from '../types'

export async function listCategories(client: ElhazemClient): Promise<Category[]> {
  const { data, error } = await client.from('categories').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data.map(mapCategory)
}

export interface ListMedicinesOptions {
  categorySlug?: string
  search?: string
  limit?: number
}

export async function listMedicines(client: ElhazemClient, options: ListMedicinesOptions = {}): Promise<Medicine[]> {
  let query = client.from('medicines').select('*').eq('active', true).order('name_ar', { ascending: true })

  if (options.categorySlug) {
    const { data: category, error: categoryError } = await client
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single()
    if (categoryError) throw categoryError
    query = query.eq('category_id', category.id)
  }
  if (options.search) {
    query = query.or(`name_ar.ilike.%${options.search}%,name_en.ilike.%${options.search}%`)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data.map(mapMedicine)
}

export async function getMedicine(client: ElhazemClient, id: string): Promise<Medicine | null> {
  const { data, error } = await client.from('medicines').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapMedicine(data) : null
}
