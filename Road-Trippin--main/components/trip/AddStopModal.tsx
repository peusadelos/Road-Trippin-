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
  }) => Promise<void>;
  dayLabel: string;
}

interface AutocompleteSuggestion {
  placePrediction?: {
    text?: { text?: string };
    mainText?: { text?: string };
    secondaryText?: { text?: string };
    placeId?: string;
    toPlace?: () => any;
  };
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
  const [predictions, setPredictions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState<Category>('attraction');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const AutocompleteSuggestionRef = useRef<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps().then(() => {
      (async () => {
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          await (window as any).google.maps.importLibrary('places');
        AutocompleteSuggestionRef.current = AutocompleteSuggestion;
        setMapsReady(true);
      })();
    });
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!mapsReady || !AutocompleteSuggestionRef.current) return;
    if (!query.trim()) {
      setPredictions([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        setSearching(true);
        const request = {
          input: query,
          language: 'en-US',
        };

        const { suggestions } =
          await AutocompleteSuggestionRef.current.fetchAutocompleteSuggestions(
            request
          );

        setPredictions(suggestions || []);
        setSearching(false);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setPredictions([]);
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, mapsReady]);

  const handleSelectPrediction = async (
    suggestion: AutocompleteSuggestion
  ) => {
    if (!suggestion.placePrediction?.toPlace) return;
    setLoading(true);
    setPredictions([]);

    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });

      const mainText =
        suggestion.placePrediction.mainText?.text ||
        suggestion.placePrediction.text?.text ||
        '';
      const secondaryText =
        suggestion.placePrediction.secondaryText?.text || '';

      setSelectedPlace({
        name: place.displayName || mainText,
        address: place.formattedAddress || secondaryText,
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
        place_id: suggestion.placePrediction.placeId || '',
      });

      setQuery(place.displayName || mainText);
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    try {
      await onAdd({
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
    } catch (error) {
      console.error('Error adding stop:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                  {predictions.map((p, idx) => {
                    const mainText = p.placePrediction?.mainText?.text || '';
                    const secondaryText =
                      p.placePrediction?.secondaryText?.text || '';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPrediction(p)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {mainText}
                          </p>
                          <p className="text-xs text-gray-400">{secondaryText}</p>
                        </div>
                      </button>
                    );
                  })}
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
