'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search, MapPin, Loader } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/google-maps/loader';
import { Category } from '@/lib/types';

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  place_id: string;
}

interface Props {
  onClose: () => void;
  onAdd: (data: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    place_id: string;
    category: string;
    notes: string;
    start_time: string;
    duration_minutes: number | null;
  }) => void;
  dayLabel: string;
}

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'attraction', label: 'Attraction', emoji: '🎯' },
  { value: 'food', label: 'Food & Drink', emoji: '🍽️' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'transport', label: 'Transport', emoji: '🚌' },
  { value: 'other', label: 'Other', emoji: '📍' },
];

export default function AddStopModal({ onClose, onAdd, dayLabel }: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState<Category>('attraction');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps().then(() => {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      if (mapDivRef.current) {
        const map = new google.maps.Map(mapDivRef.current);
        placesService.current = new google.maps.places.PlacesService(map);
      }
      setMapsReady(true);
    });
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!mapsReady || !autocompleteService.current) return;
    if (!query.trim()) {
      setPredictions([]);
      return;
    }

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearching(true);
      autocompleteService.current!.getPlacePredictions(
        { input: query },
        (results, status) => {
          setSearching(false);
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [query, mapsReady]);

  const handleSelectPrediction = (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    if (!placesService.current) return;
    setLoading(true);
    setPredictions([]);

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
      },
      (place, status) => {
        setLoading(false);
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.geometry?.location
        ) {
          setSelectedPlace({
            name: place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            place_id: place.place_id || prediction.place_id,
          });
          setQuery(
            place.name || prediction.structured_formatting.main_text
          );
        }
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    onAdd({
      name: selectedPlace.name,
      address: selectedPlace.address,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      place_id: selectedPlace.place_id,
      category,
      notes,
      start_time: startTime,
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Hidden map div for PlacesService */}
      <div ref={mapDivRef} className="hidden" />

      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add a Stop</h2>
            <p className="text-sm text-gray-400">{dayLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search place *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedPlace(null);
                  }}
                  placeholder="Search by name or address..."
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {searching && (
                  <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Predictions Dropdown */}
              {predictions.length > 0 && (
                <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {predictions.map((p) => (
                    <button
                      key={p.place_id}
                      type="button"
                      onClick={() => handleSelectPrediction(p)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.structured_formatting.main_text}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected place confirmation */}
              {selectedPlace && (
                <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {selectedPlace.name}
                    </p>
                    <p className="text-xs text-green-600 truncate">
                      {selectedPlace.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium ${
                      category === cat.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="e.g. 90"
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes about this stop..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedPlace || loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Adding...' : 'Add Stop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}