import { supabase } from './supabase'

export function getListingPhotoUrl(storagePath: string) {
  return supabase.storage.from('listing-photos').getPublicUrl(storagePath).data.publicUrl
}

export function getLotPhotoUrl(storagePath: string) {
  return supabase.storage.from('lot-photos').getPublicUrl(storagePath).data.publicUrl
}
