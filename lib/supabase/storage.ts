import { createClient } from './client';

const BUCKET = 'trip-photos';

/**
 * Returns the public URL for a stored photo path.
 */
export function getPhotoUrl(storagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Uploads a single photo file to Storage under a per-user/trip/stop folder
 * and returns the storage path (not the public URL).
 */
export async function uploadTripPhotoFile(
  file: File,
  userId: string,
  tripId: string,
  stopId: string
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const path = `${userId}/${tripId}/${stopId}/${uniqueName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;
  return path;
}

/**
 * Removes a photo file from Storage. Safe to call even if the file
 * no longer exists (Supabase Storage won't error on a missing key here).
 */
export async function deleteTripPhotoFile(storagePath: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
