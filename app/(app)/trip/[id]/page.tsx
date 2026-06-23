import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripClient from './TripClient';

interface Props {
  params: { id: string };
}

export default async function TripPage({ params }: Props) {
  const supabase = await createServerClient();
  
  console.log('=== TRIP PAGE DEBUG START ===');
  console.log('Trip ID from URL:', params.id);
  console.log('URL params:', JSON.stringify(params));

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('Session exists:', !!session);
  console.log('Session user ID:', session?.user?.id);

  if (!session) {
    console.log('❌ NO SESSION - REDIRECTING TO LOGIN');
    redirect('/login');
  }

  console.log('✅ Session valid, querying trips...');

  // Fetch trip
  const { data: trips, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id);

  console.log('Trip query complete:');
  console.log('  - trips:', trips);
  console.log('  - error:', tripError);
  console.log('  - trips length:', trips?.length);

  const trip = trips && trips.length > 0 ? trips[0] : null;

  console.log('Extracted trip:', trip ? `✅ Found: ${trip.name}` : '❌ No trip found');

  if (!trip) {
    console.log('❌ TRIP NOT FOUND - REDIRECTING TO DASHBOARD');
    console.log('Details:', { trip, tripError });
    redirect('/dashboard');
  }

  if (tripError) {
    console.log('⚠️ ERROR (but continuing):', tripError);
  }

  console.log('✅ Trip found, fetching days...');

  // Fetch days with stops
  const { data: days, error: daysError } = await supabase
    .from('trip_days')
    .select(`
      *,
      stops (*)
    `)
    .eq('trip_id', params.id)
    .order('day_number', { ascending: true });

  console.log('Days query complete:');
  console.log('  - days count:', days?.length);
  console.log('  - error:', daysError);

  if (daysError) {
    console.error('⚠️ Days query error:', daysError);
  }

  // Sort stops by order inside each day
  const daysWithSortedStops = (days || []).map((day: any) => ({
    ...day,
    stops: (day.stops || []).sort(
      (a: any, b: any) => a.order - b.order
    ),
  }));

  console.log('=== TRIP PAGE DEBUG END - RENDERING ===');
  console.log('About to render TripClient with:');
  console.log('  - trip:', trip.name);
  console.log('  - days:', daysWithSortedStops.length);

  return <TripClient trip={trip} initialDays={daysWithSortedStops} />;
}
