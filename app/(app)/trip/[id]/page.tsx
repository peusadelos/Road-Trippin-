import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripClient from './TripClient';

interface Props {
  params: { id: string };
}

export default async function TripPage({ params }: Props) {
  const supabase = await createServerClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.log('DEBUG: No session, redirecting to login');
    redirect('/login');
  }

  console.log('DEBUG: Session user ID:', session.user.id);
  console.log('DEBUG: Trip ID from URL:', params.id);

  // Fetch trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  console.log('DEBUG: Trip query result:', { trip, tripError });

  if (!trip) {
    console.log('DEBUG: No trip found, redirecting to dashboard');
    redirect('/dashboard');
  }

  console.log('DEBUG: Trip found, fetching days...');

  // Fetch days with stops
  const { data: days, error: daysError } = await supabase
    .from('trip_days')
    .select(`
      *,
      stops (*)
    `)
    .eq('trip_id', params.id)
    .order('day_number', { ascending: true });

  console.log('DEBUG: Days query result:', { daysCount: days?.length, daysError });

  // Sort stops by order inside each day
  const daysWithSortedStops = (days || []).map((day: any) => ({
    ...day,
    stops: (day.stops || []).sort(
      (a: any, b: any) => a.order - b.order
    ),
  }));

  console.log('DEBUG: Rendering TripClient');

  return <TripClient trip={trip} initialDays={daysWithSortedStops} />;
}
