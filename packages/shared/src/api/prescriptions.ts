import type { ElhazemClient } from '../supabase/createClient'
import { mapPrescription } from '../supabase/mappers'
import type { Prescription } from '../types'

const BUCKET = 'prescriptions'

// `file` لازم يكون Blob فعلي — الويب بيبعت الملف زي ما هو من `<input type="file">`،
// وموبايل بيحوّل الـ local URI لـ Blob الأول (مثلاً عن طريق `await (await fetch(uri)).blob()`).
export async function uploadPrescriptionImage(
  client: ElhazemClient,
  customerId: string,
  file: Blob,
  fileExt: string,
): Promise<Prescription> {
  const path = `${customerId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || `image/${fileExt}`,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data, error } = await client
    .from('prescriptions')
    .insert({ customer_id: customerId, image_path: path })
    .select('*')
    .single()
  if (error) throw error
  return mapPrescription(data)
}

export function getPrescriptionImageUrl(client: ElhazemClient, imagePath: string, expiresInSeconds = 3600) {
  return client.storage.from(BUCKET).createSignedUrl(imagePath, expiresInSeconds)
}

export async function listPendingPrescriptions(client: ElhazemClient): Promise<Prescription[]> {
  const { data, error } = await client
    .from('prescriptions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(mapPrescription)
}

export async function reviewPrescription(
  client: ElhazemClient,
  id: string,
  decision: { status: 'approved' | 'rejected'; reviewerNotes?: string },
): Promise<Prescription> {
  const { data: auth } = await client.auth.getUser()
  const { data, error } = await client
    .from('prescriptions')
    .update({
      status: decision.status,
      reviewer_notes: decision.reviewerNotes ?? null,
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapPrescription(data)
}
