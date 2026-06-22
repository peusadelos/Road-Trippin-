'use client';

import { useEffect, useRef, useState } from 'react';
import { TripDayWithStops, Stop } from '@/lib/types';
import { loadGoogleMaps } from '@/lib/google-maps/loader';

interface Props {
  days: TripDayWithStops[];
  selectedDayId: string;
  focusStop: Stop | null;
  onMarkerClick: (stop: Stop) => void;
}

// One color per day (up to 14 days)
const DAY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
  '#A855F7', '#22C55E',
];

export default function TripMap({
  days,
  selectedDayId,
  focusStop,
  onMarkerClick,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    loadGoogleMaps().then(() => {
      if (!mapRef.current || googleMapRef.current) return;

      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
        zoom: 4,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      setMapsLoaded(true);
    });
  }, []);

  // Draw markers and polylines when days change or selected day changes
  useEffect(() => {
    if (!mapsLoaded || !googleMapRef.current) return;

    // Clear existing markers and polylines
    markersRef.current.forEach((m) => m.setMap(null));
    polylinesRef.current.forEach((p) => p.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];

    const map = googleMapRef.current;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Determine which days to show
    const daysToShow =
      selectedDayId === 'all'
        ? days
        : days.filter((d) => d.id === selectedDayId);

    daysToShow.forEach((day, dayIndex) => {
      const actualDayIndex = days.findIndex((d) => d.id === day.id);
      const color = DAY_COLORS[actualDayIndex % DAY_COLORS.length];
      const stops = day.stops || [];

      if (stops.length === 0) return;

      // Draw polyline connecting stops
      if (stops.length > 1) {
        const path = stops.map((s) => ({ lat: s.lat || s.latitude, lng: s.lng || s.longitude }));
        const polyline = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: 3,
          map,
        });
        polylinesRef.current.push(polyline);
      }

      // Draw markers
      stops.forEach((stop, stopIndex) => {
        const position = { lat: stop.lat, lng: stop.lng };
        bounds.extend(position);
        hasPoints = true;

        // Custom marker with number
        const marker = new google.maps.Marker({
          position,
          map,
          title: stop.name,
          label: {
            text: String(stopIndex + 1),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 16,
          },
          zIndex: stopIndex + 1,
        });

        // Info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 200px;">
              <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #111;">
                ${stop.name}
              </p>
              <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">
                Day ${day.day_number} · Stop ${stopIndex + 1}
              </p>
              ${
                stop.address
                  ? `<p style="font-size: 11px; color: #888; margin: 0;">${stop.address}</p>`
                  : ''
              }
              ${
                stop.start_time
                  ? `<p style="font-size: 11px; color: #888; margin: 4px 0 0 0;">⏰ ${stop.start_time.slice(0, 5)}</p>`
                  : ''
              }
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          onMarkerClick(stop);
        });

        markersRef.current.push(marker);
      });
    });

    // Fit map to bounds
    if (hasPoints) {
      if (markersRef.current.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(14);
      } else {
        map.fitBounds(bounds, { padding: 60 });
      }
    }
  }, [mapsLoaded, days, selectedDayId, onMarkerClick]);

  // Focus on a specific stop
  useEffect(() => {
    if (!focusStop || !googleMapRef.current || !mapsLoaded) return;

    googleMapRef.current.setCenter({ lat: focusStop.lat, lng: focusStop.lng });
    googleMapRef.current.setZoom(15);
  }, [focusStop, mapsLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-md p-3 max-w-[200px]">
        <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
          Days
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {days
            .filter((d) => d.stops?.length > 0)
            .map((day, index) => (
              <div key={day.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      DAY_COLORS[
                        days.findIndex((d) => d.id === day.id) %
                          DAY_COLORS.length
                      ],
                  }}
                />
                <span className="text-xs text-gray-600">
                  Day {day.day_number} ({day.stops.length} stops)
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
