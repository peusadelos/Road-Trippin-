'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPhotoUrl, uploadTripPhotoFile, deleteTripPhotoFile } from '@/lib/supabase/storage';
import { Stop, TripPhoto, Category } from '@/lib/types';
import {
  X,
  Upload,
  Loader,
  Trash2,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  stop: Stop;
  dayLabel: string;
  photos: TripPhoto[];
  tripId: string;
  userId: string;
  isDayCover: (photoId: string) => boolean;
  onClose: () => void;
  onPhotosAdded: (photos: TripPhoto[]) => void;
  onPhotoDeleted: (photoId: string) => void;
  onCaptionChanged: (photoId: string, caption: string) => void;
  onSetDayCover: (photoId: string) => void;
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

export default function PhotoGalleryModal({
  stop,
  dayLabel,
  photos,
  tripId,
  userId,
  isDayCover,
  onClose,
  onPhotosAdded,
  onPhotoDeleted,
  onCaptionChanged,
  onSetDayCover,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos: TripPhoto[] = [];
      let sortOrder = photos.length;

      for (const file of files) {
        const path = await uploadTripPhotoFile(file, userId, tripId, stop.id);

        const { data, error } = await supabase
          .from('trip_photos')
          .insert({
            trip_id: tripId,
            stop_id: stop.id,
            user_id: userId,
            storage_path: path,
            sort_order: sortOrder++,
          })
          .select()
          .single();

        if (!error && data) newPhotos.push(data as TripPhoto);
      }

      if (newPhotos.length > 0) onPhotosAdded(newPhotos);
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: TripPhoto) => {
    setDeletingId(photo.id);
    try {
      await supabase.from('trip_photos').delete().eq('id', photo.id);
      await deleteTripPhotoFile(photo.storage_path);
      onPhotoDeleted(photo.id);
      setLightboxIndex(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCaptionBlur = async (photo: TripPhoto, caption: string) => {
    if (caption === (photo.caption || '')) return;
    onCaptionChanged(photo.id, caption);
    await supabase.from('trip_photos').update({ caption }).eq('id', photo.id);
  };

  const categoryEmoji = CATEGORY_EMOJI[stop.category as Category] || '📍';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{categoryEmoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {dayLabel}
              </p>
              <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">
                {stop.name}
              </h2>
              {stop.address && (
                <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{stop.address}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-500">
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">Drop photos here or click to upload</span>
                <span className="text-xs text-gray-400">JPG, PNG, HEIC — multiple allowed</span>
              </div>
            )}
          </div>

          {/* Photo grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="rounded-xl border border-gray-200 overflow-hidden bg-white"
                >
                  <div
                    className="relative h-32 bg-gray-100 cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={getPhotoUrl(photo.storage_path)}
                      alt={photo.caption || stop.name}
                      className="w-full h-full object-cover"
                    />
                    {isDayCover(photo.id) && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-400 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="p-2 space-y-1.5">
                    <input
                      defaultValue={photo.caption || ''}
                      placeholder="Add a caption…"
                      onBlur={(e) => handleCaptionBlur(photo, e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onSetDayCover(photo.id)}
                        disabled={isDayCover(photo.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200 disabled:opacity-40"
                      >
                        <Star className="w-3 h-3" />
                        {isDayCover(photo.id) ? 'Day cover' : 'Set cover'}
                      </button>
                      <button
                        onClick={() => handleDelete(photo)}
                        disabled={deletingId === photo.id}
                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === photo.id ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !uploading && (
              <p className="text-center text-sm text-gray-400 py-4">
                No photos yet — add the first one from this stop!
              </p>
            )
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 text-white/80 hover:text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 text-white/80 hover:text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <div
            className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getPhotoUrl(photos[lightboxIndex].storage_path)}
              alt={photos[lightboxIndex].caption || stop.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            {photos[lightboxIndex].caption && (
              <p className="text-white/90 text-sm text-center">{photos[lightboxIndex].caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
