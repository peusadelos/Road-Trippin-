'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Trip, TripDayWithStops, Stop } from '@/lib/types';
import { optimizeRoute } from '@/lib/utils/optimize-route';
import Navbar from '@/components/ui/Navbar';
import DaySidebar from '@/components/trip/DaySidebar';
import TripMap from '@/components/map/TripMap';
import AddStopModal from '@/components/trip/AddStopModal';
import StopDetailModal from '@/components/trip/StopDetailModal';

interface Props {
  trip: Trip;
  initialDays: TripDayWithStops[];
}

export default function TripClient({ trip, initialDays }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [days, setDays] = useState<TripDayWithStops[]>(initialDays);
  const [selectedDayId, setSelectedDayId] = useState<string>(
    initialDays[0]?.id || ''
  );
  const [showAddStop, setShowAddStop] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [mapFocusStop, setMapFocusStop] = useState<Stop | null>(null);
  const [isMobileMapView, setIsMobileMapView] = useState(false);

  const selectedDay = days.find((d) => d.id === selectedDayId);

  // Add a new stop to selected day
  const handleAddStop = useCallback(
    async (stopData: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      place_id: string;
      category: string;
      notes: string;
      start_time: string;
      duration_minutes: number | null;
    }) => {
      if (!selectedDay) return;

      const currentStops = selectedDay.stops || [];
      const newOrder = currentStops.length;

      const { data: newStop, error } = await supabase
        .from('stops')
        .insert({
          trip_id: trip.id,
          day_id: selectedDay.id,
          name: stopData.name,
          address: stopData.address,
          lat: stopData.lat,
          lng: stopData.lng,
          place_id: stopData.place_id,
          category: stopData.category,
          notes: stopData.notes,
          start_time: stopData.start_time || null,
          duration_minutes: stopData.duration_minutes,
          sort_order: newOrder,
        })
        .select()
        .single();

      if (error || !newStop) return;

      setDays((prev) =>
        prev.map((day) =>
          day.id === selectedDay.id
            ? { ...day, stops: [...(day.stops || []), newStop] }
            : day
        )
      );

      setShowAddStop(false);
    },
    [selectedDay, trip.id, supabase]
  );

  // Add nearby stop
  const handleAddNearbyStop = useCallback(
    async (stopData: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      place_id: string;
      category: string;
    }) => {
      if (!selectedDay) return;

      const currentStops = selectedDay.stops || [];
      const newOrder = currentStops.length;

      const { data: newStop, error } = await supabase
        .from('stops')
        .insert({
          trip_id: trip.id,
          day_id: selectedDay.id,
          name: stopData.name,
          address: stopData.address,
          lat: stopData.lat,
          lng: stopData.lng,
          place_id: stopData.place_id,
          category: stopData.category,
          notes: null,
          start_time: null,
          duration_minutes: null,
          sort_order: newOrder,
        })
        .select()
        .single();

      if (error || !newStop) {
        throw new Error('Failed to add nearby stop');
      }

      setDays((prev) =>
        prev.map((day) =>
          day.id === selectedDay.id
            ? { ...day, stops: [...(day.stops || []), newStop] }
            : day
        )
      );
    },
    [selectedDay, trip.id, supabase]
  );

  // Update a stop
  const handleUpdateStop = useCallback(
    async (stopId: string, updates: Partial<Stop>) => {
      const { error } = await supabase
        .from('stops')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', stopId);

      if (error) return;

      setDays((prev) =>
        prev.map((day) => ({
          ...day,
          stops: day.stops.map((s) =>
            s.id === stopId ? { ...s, ...updates } : s
          ),
        }))
      );

      setSelectedStop((prev) =>
        prev?.id === stopId ? { ...prev, ...updates } : prev
      );
    },
    [supabase]
  );

  // Delete a stop
  const handleDeleteStop = useCallback(
    async (stopId: string) => {
      const { error } = await supabase
        .from('stops')
        .delete()
        .eq('id', stopId);

      if (error) return;

      setDays((prev) =>
        prev.map((day) => ({
          ...day,
          stops: day.stops
            .filter((s) => s.id !== stopId)
            .map((s, i) => ({ ...s, sort_order: i })),
        }))
      );

      setSelectedStop(null);
    },
    [supabase]
  );

  // Reorder stops after drag and drop
  const handleReorderStops = useCallback(
    async (dayId: string, reorderedStops: Stop[]) => {
      const updatedStops = reorderedStops.map((s, i) => ({
        ...s,
        sort_order: i,
      }));

      setDays((prev) =>
        prev.map((day) =>
          day.id === dayId ? { ...day, stops: updatedStops } : day
        )
      );

      // Update order in database
      await Promise.all(
        updatedStops.map((stop) =>
          supabase
            .from('stops')
            .update({ sort_order: stop.sort_order })
            .eq('id', stop.id)
        )
      );
    },
    [supabase]
  );

  // Optimize route for selected day
  const handleOptimizeRoute = useCallback(async () => {
    if (!selectedDay || selectedDay.stops.length < 2) return;

    const optimized = optimizeRoute(selectedDay.stops);
    await handleReorderStops(selectedDay.id, optimized);
  }, [selectedDay, handleReorderStops]);

  // Share to Google Maps
  const handleShareToGoogleMaps = useCallback(() => {
    if (!selectedDay || selectedDay.stops.length === 0) {
      alert('Add stops to your itinerary first!');
      return;
    }

    const stops = selectedDay.stops;
    
    // Build waypoints URL for Google Maps
    // Format: https://www.google.com/maps/dir/?api=1&origin=START&destination=END&waypoints=WP1|WP2|etc
    if (stops.length === 1) {
      // Single stop - open it on the map
      const stop = stops[0];
      const url = `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`;
      window.open(url, '_blank');
    } else {
      // Multiple stops - create a route
      const origin = `${stops[0].lat},${stops[0].lng}`;
      const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
      const waypoints = stops
        .slice(1, -1)
        .map((s) => `${s.lat},${s.lng}`)
        .join('|');

      let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      if (waypoints) {
        url += `&waypoints=${waypoints}`;
      }

      window.open(url, '_blank');
    }
  }, [selectedDay]);

  // Toggle share
  const handleToggleShare = useCallback(async () => {
    const newValue = !trip.share_enabled;
    await supabase
      .from('trips')
      .update({ share_enabled: newValue })
      .eq('id', trip.id);
    router.refresh();
  }, [trip, supabase, router]);

  // Focus map on a stop
  const handleStopClickInSidebar = useCallback((stop: Stop) => {
    setMapFocusStop(stop);
    setIsMobileMapView(true);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Navbar */}
      <Navbar
        trip={trip}
        onToggleShare={handleToggleShare}
        onBack={() => router.push('/dashboard')}
      />

      {/* Mobile Tab Toggle */}
      <div className="flex md:hidden border-b border-gray-200 bg-white">
        <button
          onClick={() => setIsMobileMapView(false)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            !isMobileMapView
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          📋 Itinerary
        </button>
        <button
          onClick={() => setIsMobileMapView(true)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            isMobileMapView
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          🗺️ Map
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - always visible on desktop, conditional on mobile */}
        <div
          className={`
            w-full md:w-96 flex-shrink-0 
            ${isMobileMapView ? 'hidden md:flex' : 'flex'}
            flex-col bg-white border-r border-gray-200
          `}
        >
          <DaySidebar
            days={days}
            selectedDayId={selectedDayId}
            onSelectDay={setSelectedDayId}
            onAddStop={() => setShowAddStop(true)}
            onOptimizeRoute={handleOptimizeRoute}
            onShareToMaps={handleShareToGoogleMaps}
            onStopClick={(stop) => {
              setSelectedStop(stop);
              handleStopClickInSidebar(stop);
            }}
            onReorderStops={handleReorderStops}
          />
        </div>

        {/* Map - always visible on desktop, conditional on mobile */}
        <div
          className={`
            flex-1
            ${!isMobileMapView ? 'hidden md:block' : 'block'}
          `}
        >
          <TripMap
            days={days}
            selectedDayId={selectedDayId}
            focusStop={mapFocusStop}
            onMarkerClick={(stop) => setSelectedStop(stop)}
          />
        </div>
      </div>

      {/* Add Stop Modal */}
      {showAddStop && (
        <AddStopModal
          onClose={() => setShowAddStop(false)}
          onAdd={handleAddStop}
          dayLabel={
            selectedDay
              ? `Day ${selectedDay.day_number} · ${selectedDay.date}`
              : ''
          }
        />
      )}

      {/* Stop Detail Modal */}
      {selectedStop && (
        <StopDetailModal
          stop={selectedStop}
          onClose={() => setSelectedStop(null)}
          onUpdate={handleUpdateStop}
          onDelete={handleDeleteStop}
          onAddNearbyStop={handleAddNearbyStop}
        />
      )}
    </div>
  );
}
