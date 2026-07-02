'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Stop, Category } from '@/lib/types';
import { GripVertical, Clock, Timer } from 'lucide-react';

interface Props {
  stop: Stop;
  index: number;
  onClick: () => void;
}

const CATEGORY_CONFIG: Record<
  Category,
  { emoji: string; color: string; bg: string }
> = {
  food: { emoji: '🍽️', color: 'text-orange-700', bg: 'bg-orange-100' },
  hotel: { emoji: '🏨', color: 'text-blue-700', bg: 'bg-blue-100' },
  attraction: { emoji: '🎯', color: 'text-purple-700', bg: 'bg-purple-100' },
  activity: { emoji: '🎪', color: 'text-red-700', bg: 'bg-red-100' },
  shopping: { emoji: '🛍️', color: 'text-pink-700', bg: 'bg-pink-100' },
  nature: { emoji: '🌿', color: 'text-green-700', bg: 'bg-green-100' },
  transport: { emoji: '🚌', color: 'text-gray-700', bg: 'bg-gray-100' },
  other: { emoji: '📍', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export default function StopCard({ stop, index, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const category = CATEGORY_CONFIG[stop.category as Category] || CATEGORY_CONFIG.other;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all ${
        isDragging ? 'shadow-lg border-blue-400' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Stop Number */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {stop.name}
            </p>
            <span
              className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${category.bg} ${category.color}`}
            >
              {category.emoji}
            </span>
          </div>

          {stop.address && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {stop.address}
            </p>
          )}

          {/* Time info */}
          <div className="flex items-center gap-3 mt-1.5">
            {stop.start_time && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {stop.start_time.slice(0, 5)}
              </span>
            )}
            {stop.duration_minutes && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Timer className="w-3 h-3" />
                {stop.duration_minutes < 60
                  ? `${stop.duration_minutes}min`
                  : `${Math.floor(stop.duration_minutes / 60)}h${
                      stop.duration_minutes % 60
                        ? ` ${stop.duration_minutes % 60}min`
                        : ''
                    }`}
              </span>
            )}
            {stop.notes && (
              <span className="text-xs text-gray-400 truncate">
                📝 {stop.notes}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
