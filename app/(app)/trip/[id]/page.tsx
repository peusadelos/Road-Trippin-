import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripClient from './TripClient';

interface Props {
  params: { id: string };
}

export default async function TripPage({ params }: Props) {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch trip
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (!trip) redirect('/dashboard');

  // Fetch days with stops
  const { data: days } = await supabase
    .from('trip_days')
    .select(`
      *,
      stops (*)
    `)
    .eq('trip_id', params.id)
    .order('day_number', { ascending: true });

  // Sort stops by sort_order inside each day
  const daysWithSortedStops = (days || []).map((day) => ({
    ...day,
    stops: (day.stops || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    ),
  }));

  return <TripClient trip={trip} initialDays={daysWithSortedStops} />;
}