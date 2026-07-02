'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPhotoUrl } from '@/lib/supabase/storage';
import { Trip, TripDayWithStops, TripPhoto, Stop, Category } from '@/lib/types';
import { formatFullDate, formatDayLabel, getTripDuration } from '@/lib/utils/date-helpers';
import {
  ArrowLeft,
  Camera,
  Download,
  MapPin,
  Sparkles,
  BookOpen,
  ImageIcon,
} from 'lucide-react';
import PhotoGalleryModal from './PhotoGalleryModal';

interface Props {
  trip: Trip;
  initialDays: TripDayWithStops[];
  initialPhotos: TripPhoto[];
}

const CATEGORY_EMOJI: Record<Category, string> = {
  food: '🍽️',
  hotel: '🏨',
  attraction: '🎯',
  activity: '🎪',
  shopping: '🛍️',
  nature: '🌿',
  transport: '🚌',
  other: '📍',
};

export default function JournalClient({ trip, initialDays, initialPhotos }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [days, setDays] = useState<TripDayWithStops[]>(initialDays);
  const [photos, setPhotos] = useState<TripPhoto[]>(initialPhotos);
  const [endedAt, setEndedAt] = useState<string | null | undefined>(trip.ended_at);
  const [ending, setEnding] = useState(false);
  const [selected, setSelected] = useState<{ stop: Stop; day: TripDayWithStops } | null>(null);

  const photosByStop = useMemo(() => {
    const map: Record<string, TripPhoto[]> = {};
    for (const photo of photos) {
      if (!map[photo.stop_id]) map[photo.stop_id] = [];
      map[photo.stop_id].push(photo);
    }
    return map;
  }, [photos]);

  const stats = useMemo(() => {
    const totalStops = days.reduce((sum, d) => sum + (d.stops?.length || 0), 0);
    const categories = new Set<string>();
    days.forEach((d) => d.stops?.forEach((s) => s.category && categories.add(s.category)));
    return {
      days: days.length,
      stops: totalStops,
      photos: photos.length,
      categories: categories.size,
    };
  }, [days, photos]);

  const getDayCoverUrl = (day: TripDayWithStops): string | undefined => {
    if (!day.cover_photo_id) return undefined;
    const photo = photos.find((p) => p.id === day.cover_photo_id);
    return photo ? getPhotoUrl(photo.storage_path) : undefined;
  };

  const handleEndTrip = async () => {
    setEnding(true);
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('trips')
      .update({ ended_at: nowIso, is_active: false })
      .eq('id', trip.id);

    if (!error) {
      setEndedAt(nowIso);
      router.refresh();
    }
    setEnding(false);
  };

  const handlePhotosAdded = (newPhotos: TripPhoto[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDays((prev) =>
      prev.map((d) => (d.cover_photo_id === photoId ? { ...d, cover_photo_id: null } : d))
    );
  };

  const handleCaptionChanged = (photoId: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  };

  const handleSetDayCover = async (dayId: string, photoId: string) => {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, cover_photo_id: photoId } : d)));
    await supabase.from('trip_days').update({ cover_photo_id: photoId }).eq('id', dayId);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-amber-50/40">
      {/* Top bar - hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push(`/trip/${trip.id}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to trip
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!endedAt && (
              <button
                onClick={handleEndTrip}
                disabled={ending}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {ending ? 'Ending trip…' : 'End Trip & Unlock Journal'}
              </button>
            )}
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export to PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:py-0 print:px-0">
        {!endedAt && (
          <div className="print:hidden mb-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              This trip hasn&apos;t been officially ended yet. You can still add photos now, but
              hit <strong>&ldquo;End Trip &amp; Unlock Journal&rdquo;</strong> above once
              you&apos;re back home to lock in the memory.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10 print:mb-6">
          <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">
              Clara&apos;s Journal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ color: trip.cover_color }}>
            {trip.name}
          </h1>
          {trip.description && (
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">{trip.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-3">
            {formatFullDate(trip.start_date)} → {formatFullDate(trip.end_date)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-12 print:mb-6">
          {[
            { label: 'Days', value: getTripDuration(trip.start_date, trip.end_date) },
            { label: 'Stops', value: stats.stops },
            { label: 'Photos', value: stats.photos },
            { label: 'Categories', value: stats.categories },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Days - scrapbook timeline */}
        <div className="space-y-10">
          {days.map((day) => {
            const coverUrl = getDayCoverUrl(day);
            return (
              <div
                key={day.id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden print:break-inside-avoid print:shadow-none print:border-gray-300"
              >
                {/* Day hero */}
                <div
                  className="relative h-40 sm:h-56 flex items-end p-5 sm:p-6"
                  style={
                    coverUrl
                      ? {
                          backgroundImage: `url(${coverUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : { backgroundColor: trip.cover_color, opacity: 0.9 }
                  }
                >
                  {coverUrl && <div className="absolute inset-0 bg-black/40" />}
                  <div className="relative">
                    <p
                      className={`text-xs font-semibold uppercase tracking-widest ${
                        coverUrl ? 'text-white/80' : 'text-white/90'
                      }`}
                    >
                      Day {day.day_number}
                    </p>
                    <h2 className={`text-xl sm:text-2xl font-bold ${coverUrl ? 'text-white' : 'text-white'}`}>
                      {day.title || formatDayLabel(day.date, day.day_number)}
                    </h2>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {day.notes && (
                    <p className="text-sm text-gray-600 mb-4 italic">&ldquo;{day.notes}&rdquo;</p>
                  )}

                  {(!day.stops || day.stops.length === 0) && (
                    <p className="text-sm text-gray-400">No stops logged for this day.</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {day.stops?.map((stop) => {
                      const stopPhotos = photosByStop[stop.id] || [];
                      const thumb = stopPhotos[0];
                      return (
                        <button
                          key={stop.id}
                          onClick={() => setSelected({ stop, day })}
                          className="group text-left rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all print:break-inside-avoid"
                        >
                          <div className="relative h-24 sm:h-28 bg-gray-100 flex items-center justify-center">
                            {thumb ? (
                              <img
                                src={getPhotoUrl(thumb.storage_path)}
                                alt={stop.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-gray-300" />
                            )}
                            {stopPhotos.length > 0 && (
                              <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                {stopPhotos.length}
                              </span>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-medium text-gray-900 truncate flex items-center gap-1">
                              <span>{CATEGORY_EMOJI[stop.category as Category] || '📍'}</span>
                              <span className="truncate">{stop.name}</span>
                            </p>
                            {stop.address && (
                              <p className="text-[11px] text-gray-400 truncate flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{stop.address}</span>
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {days.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>No days planned for this trip yet.</p>
          </div>
        )}
      </div>

      {/* Photo Gallery Modal */}
      {selected && (
        <PhotoGalleryModal
          stop={selected.stop}
          dayLabel={formatDayLabel(selected.day.date, selected.day.day_number)}
          photos={photosByStop[selected.stop.id] || []}
          tripId={trip.id}
          userId={trip.user_id}
          isDayCover={(photoId) => selected.day.cover_photo_id === photoId}
          onClose={() => setSelected(null)}
          onPhotosAdded={handlePhotosAdded}
          onPhotoDeleted={handlePhotoDeleted}
          onCaptionChanged={handleCaptionChanged}
          onSetDayCover={(photoId) => handleSetDayCover(selected.day.id, photoId)}
        />
      )}

      <style jsx global>{`
        @media print {
          nav,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
