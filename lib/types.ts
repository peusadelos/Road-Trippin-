export interface Trip {
  id: string;
  user_id: string;
  title: string;
  name?: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  share_enabled: boolean;
  share_token?: string;
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
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  day_id: string;
  trip_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  order: number;
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
