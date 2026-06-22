'use client';

import { useState } from 'react';
import { TripDayWithStops, Stop } from '@/lib/types';
import { formatDayLabel } from '@/lib/utils/date-helpers';
import { Plus, Zap, ChevronRight } from 'lucide-react';
import StopList from './StopList';

interface Props {
  days: TripDayWithStops[];
  selectedDayId: string;
  onSelectDay: (id: string) => void;
  onAddStop: () => void;
  onOptimizeRoute: () => void;
  onStopClick: (stop: Stop) => void;
  onReorderStops: (dayId: string, stops: Stop[]) => void;
}

export default function DaySidebar({
  days,
  selectedDayId,
  onSelectDay,
  onAddStop,
  onOptimizeRoute,
  onStopClick,
  onReorderStops,
}: Props) {
  const selectedDay = days.find((d) => d.id === selectedDayId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day Selector */}
      <div className="border-b border-gray-100">
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Days
          </p>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedDayId === day.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="whitespace-nowrap">Day {day.day_number}</div>
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
      </div>

      {/* Selected Day Header */}
      {selectedDay && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">
                {formatDayLabel(selectedDay.date, selectedDay.day_number)}
              </h2>
              {selectedDay.title && (
                <p className="text-sm text-gray-500">{selectedDay.title}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Optimize Button */}
              {selectedDay.stops?.length > 1 && (
                <button
                  onClick={onOptimizeRoute}
                  title="Optimize route"
                  className="flex items-center gap-1 px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Optimize
                </button>
              )}
              {/* Add Stop Button */}
              <button
                onClick={onAddStop}
                className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className="flex-1 overflow-y-auto">
        {selectedDay ? (
          selectedDay.stops?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <span className="text-4xl mb-3">📍</span>
              <p className="font-medium text-gray-700 mb-1">No stops yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Add places you want to visit on this day
              </p>
              <button
                onClick={onAddStop}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add your first stop
              </button>
            </div>
          ) : (
            <StopList
              stops={selectedDay.stops}
              dayId={selectedDay.id}
              onStopClick={onStopClick}
              onReorder={onReorderStops}
            />
          )
        ) : null}
      </div>
    </div>
  );
}