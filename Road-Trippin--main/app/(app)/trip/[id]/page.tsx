import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripClient from './TripClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.log('DEBUG: No session, redirecting to login');
    redirect('/login');
  }

  console.log('=== TRIP PAGE DEBUG ===');
  console.log('Trip ID:', id);
  console.log('User ID:', session.user.id);

  // DIAGNOSTIC TEST: Query WITHOUT user_id filter to see if data exists at all
  console.log('DEBUG: Testing query without user_id filter...');
  const { data: allTrips, error: allError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id);

  console.log('DEBUG: All trips (no filter):', { count: allTrips?.length, allError });
  if (allTrips && allTrips.length > 0) {
    console.log('DEBUG: Trip found! Details:', allTrips[0]);
  }

  // Now query WITH user_id filter
  console.log('DEBUG: Testing query WITH user_id filter...');
  const { data: userTrips, error: userError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id);

  console.log('DEBUG: User trips (with filter):', { count: userTrips?.length, userError });

  // Use the filtered results
  const trip = userTrips && userTrips.length > 0 ? userTrips[0] : null;

  if (!trip) {
    console.log('❌ NO TRIP FOUND - ANALYSIS:');
    if (allTrips && allTrips.length > 0) {
      console.log('  ⚠️ Trip EXISTS in database but user_id filter failed!');
      console.log('  Possible causes: RLS policy, user_id mismatch');
      console.log('  Trip in DB:', allTrips[0].id, 'user_id:', allTrips[0].user_id);
      console.log('  Session user_id:', session.user.id);
    } else {
      console.log('  ❌ Trip does not exist in database at all');
    }
    redirect('/dashboard');
  }

  console.log('✅ Trip found:', trip.name);

  // Fetch days with stops
  const { data: days, error: daysError } = await supabase
    .from('trip_days')
    .select(`
      *,
      stops (*)
    `)
    .eq('trip_id', id)
    .order('day_number', { ascending: true });

  if (daysError) {
    console.error('DEBUG: Error fetching days:', daysError);
  }

  // Sort stops by order inside each day
  const daysWithSortedStops = (days || []).map((day: any) => ({
    ...day,
    stops: (day.stops || []).sort(
      (a: any, b: any) => a.order - b.order
    ),
  }));

  console.log('=== RENDERING TRIP PAGE ===');

  return <TripClient trip={trip} initialDays={daysWithSortedStops} />;
}
