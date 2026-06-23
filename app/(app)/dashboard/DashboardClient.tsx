'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Trip, Profile } from '@/lib/types';
import { formatFullDate, generateDays, getTripDuration } from '@/lib/utils/date-helpers';
import { Plus, MapPin, Calendar, LogOut, Archive } from 'lucide-react';
import CreateTripModal from '@/components/dashboard/CreateTripModal';

interface Props {
  trips: Trip[];
  profile: Profile;
}

export default function DashboardClient({ trips, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeTrip = trips.find((t) => t.is_active);
  const archivedTrips = trips.filter((t) => !t.is_active);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleCreateTrip = async (data: {
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    coverColor: string;
  }) => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    // Archive current active trip if exists
    if (activeTrip) {
      await supabase
        .from('trips')
        .update({ is_active: false })
        .eq('id', activeTrip.id);
    }

    // Create new trip
    const { data: newTrip, error } = await supabase
      .from('trips')
      .insert({
        user_id: session.user.id,
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        description: data.description,
        cover_color: data.coverColor,
        is_active: true,
      })
      .select()
      .single();

    if (error || !newTrip) {
      console.error('Error creating trip:', error);
      setLoading(false);
      return;
    }

    // Auto-generate days
    const days = generateDays(data.startDate, data.endDate);
    const { error: daysError } = await supabase
      .from('trip_days')
      .insert(
        days.map((day) => ({
          trip_id: newTrip.id,
          day_number: day.day_number,
          date: day.date,
        }))
      );

    if (daysError) {
      console.error('Error creating days:', daysError);
    }

    setLoading(false);
    setShowCreateModal(false);
    router.push(`/trip/${newTrip.id}`);
    router.refresh();
  };

  const handleOpenTrip = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <span className="text-xl font-bold text-gray-900">
                Road Trippin'
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Hi, {profile?.full_name || 'Traveler'}!
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        </div>

        {/* Active Trip */}
        {activeTrip ? (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Current Trip
            </h2>
            <div
              onClick={() => handleOpenTrip(activeTrip.id)}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeft: `4px solid ${activeTrip.cover_color}` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {activeTrip.name}
                  </h3>
                  {activeTrip.description && (
                    <p className="text-gray-500 mt-1">{activeTrip.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatFullDate(activeTrip.start_date)} →{' '}
                      {formatFullDate(activeTrip.end_date)}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {getTripDuration(activeTrip.start_date, activeTrip.end_date)} days
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 mb-10">
            <span className="text-5xl mb-4 block">🗺️</span>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No active trip
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first trip to get started!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create a trip
            </button>
          </div>
        )}

        {/* Archived Trips */}
        {archivedTrips.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archived Trips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedTrips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => handleOpenTrip(trip.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow opacity-75 hover:opacity-100"
                  style={{ borderLeft: `4px solid ${trip.cover_color}` }}
                >
                  <h3 className="font-bold text-gray-800">{trip.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFullDate(trip.start_date)} →{' '}
                    {formatFullDate(trip.end_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getTripDuration(trip.start_date, trip.end_date)} days
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <CreateTripModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTrip}
          loading={loading}
          hasActiveTrip={!!activeTrip}
        />
      )}
    </div>
  );
}
