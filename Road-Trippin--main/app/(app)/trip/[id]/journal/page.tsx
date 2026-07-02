import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JournalClient from '@/components/journal/JournalClient';
import { Stop } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JournalPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (!trip) {
    redirect('/dashboard');
  }

  const { data: days } = await supabase
    .from('trip_days')
    .select(`*, stops (*)`)
    .eq('trip_id', id)
    .order('day_number', { ascending: true });

  const { data: photos } = await supabase
    .from('trip_photos')
    .select('*')
    .eq('trip_id', id)
    .order('sort_order', { ascending: true });

  const daysWithSortedStops = (days || []).map((day) => ({
    ...day,
    stops: ((day.stops || []) as Stop[]).sort(
      (a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0)
    ),
  }));

  return (
    <JournalClient
      trip={trip}
      initialDays={daysWithSortedStops}
      initialPhotos={photos || []}
    />
  );
}
