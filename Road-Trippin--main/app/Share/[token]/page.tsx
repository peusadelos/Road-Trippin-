import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ShareClient from './ShareClient';

interface Props {
  params: { token: string };
}

export default async function SharePage({ params }: Props) {
  const supabase = await createServerClient();

  // Find trip by share token
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('share_token', params.token)
    .eq('share_enabled', true)
    .single();

  if (!trip) notFound();

  // Fetch days and stops
  const { data: days } = await supabase
    .from('trip_days')
    .select(`*, stops (*)`)
    .eq('trip_id', trip.id)
    .order('day_number', { ascending: true });

  const daysWithSortedStops = (days || []).map((day) => ({
    ...day,
    stops: (day.stops || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    ),
  }));

  return <ShareClient trip={trip} days={daysWithSortedStops} />;
}
