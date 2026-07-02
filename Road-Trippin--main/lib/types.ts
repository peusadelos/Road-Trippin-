export interface Trip {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  cover_color: string;
  is_active: boolean;
  share_enabled: boolean;
  share_token?: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title?: string;
  notes?: string;
  cover_photo_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripPhoto {
  id: string;
  trip_id: string;
  stop_id: string;
  user_id: string;
  storage_path: string;
  caption?: string | null;
  sort_order: number;
  created_at: string;
}

export interface Stop {
  id: string;
  day_id: string;
  trip_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  lat?: number;      // Keep for backwards compatibility
  lng?: number;      // Keep for backwards compatibility
  order: number;
  sort_order?: number;  // Keep for backwards compatibility
  category?: string;
  start_time?: string;
  notes?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface TripDayWithStops extends TripDay {
  stops: Stop[];
}

export interface TripDayWithPhotos extends TripDayWithStops {
  photosByStop: Record<string, TripPhoto[]>;
  coverPhotoUrl?: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ShareToken {
  id: string;
  trip_id: string;
  token: string;
  created_at: string;
  expires_at?: string;
}

export type Category = 'attraction' | 'food' | 'hotel' | 'nature' | 'activity' | 'shopping' | 'transport' | 'other';
