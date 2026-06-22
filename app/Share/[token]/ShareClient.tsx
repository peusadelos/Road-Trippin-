'use client';

import { useState } from 'react';
import { Trip, TripDayWithStops, Stop } from '@/lib/types';
import { formatDayLabel, formatFullDate, getTripDuration } from '@/lib/utils/date-helpers';
import { MapPin, Calendar, Clock, Timer, Tag } from 'lucide-react';
import TripMap from '@/components/map/TripMap';

interface Props {
  trip: Trip;
  days: TripDayWithStops[];
}

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string }> = {
  food: { emoji: '🍽️', label: 'Food & Drink' },
  hotel: { emoji: '🏨', label: 'Hotel' },
  attraction: { emoji: '🎯', label: 'Attraction' },
  shopping: { emoji: '🛍️', label: 'Shopping' },
  nature: { emoji: '🌿', label: 'Nature' },
  transport: { emoji: '🚌', label: 'Transport' },
  other: { emoji: '📍', label: 'Other' },
};

export default function ShareClient({ trip, days }: Props) {
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id || '');
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isMobileMapView, setIsMobileMapView] = useState(false);

  const selectedDay = days.find((d) => d.id === selectedDayId);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{trip.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFullDate(trip.start_date)} →{' '}
                  {formatFullDate(trip.end_date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getTripDuration(trip.start_date, trip.end_date)} days
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
            👁️ View only
          </span>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="flex md:hidden border-b border-gray-200 bg-white">
        <button
          onClick={() => setIsMobileMapView(false)}
          className={`flex-1 py-3 text-sm font-medium ${
            !isMobileMapView
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          📋 Itinerary
        </button>
        <button
          onClick={() => setIsMobileMapView(true)}
          className={`flex-1 py-3 text-sm font-medium ${
            isMobileMapView
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          🗺️ Map
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Sidebar */}
        <div
          className={`w-full md:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden ${
            isMobileMapView ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Day Selector */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedDayId === day.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div>Day {day.day_number}</div>
                  <div
                    className={`text-xs ${
                      selectedDayId === day.id
                        ? 'text-blue-200'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.stops?.length || 0} stops
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stops */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedDay?.stops?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No stops for this day</p>
              </div>
            ) : (
              selectedDay?.stops?.map((stop, index) => {
                const cat =
                  CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.other;
                return (
                  <div
                    key={stop.id}
                    onClick={() => setSelectedStop(stop)}
                    className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {stop.name}
                          </p>
                          <span className="flex-shrink-0 text-sm">
                            {cat.emoji}
                          </span>
                        </div>
                        {stop.address && (
                          <p className="text-xs text-gray-400 truncate">
                            {stop.address}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {stop.start_time && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {stop.start_time.slice(0, 5)}
                            </span>
                          )}
                          {stop.duration_minutes && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {stop.duration_minutes}min
                            </span>
                          )}
                        </div>
                        {stop.notes && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            📝 {stop.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Made with 🚗{' '}
              <a href="/" className="text-blue-500 hover:underline">
                Road Trippin'
              </a>
            </p>
          </div>
        </div>

        {/* Map */}
        <div
          className={`flex-1 ${
            !isMobileMapView ? 'hidden md:block' : 'block'
          }`}
        >
          <TripMap
            days={days}
            selectedDayId={selectedDayId}
            focusStop={selectedStop}
            onMarkerClick={setSelectedStop}
          />
        </div>
      </div>
    </div>
  );
}