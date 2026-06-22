'use client';

import { useState } from 'react';
import { Stop, Category } from '@/lib/types';
import { X, Edit2, Trash2, Save, MapPin, Clock, Timer, Tag } from 'lucide-react';

interface Props {
  stop: Stop;
  onClose: () => void;
  onUpdate: (stopId: string, updates: Partial<Stop>) => void;
  onDelete: (stopId: string) => void;
}

const CATEGORY_CONFIG: Record<
  Category,
  { emoji: string; label: string }
> = {
  food: { emoji: '🍽️', label: 'Food & Drink' },
  hotel: { emoji: '🏨', label: 'Hotel' },
  attraction: { emoji: '🎯', label: 'Attraction' },
  shopping: { emoji: '🛍️', label: 'Shopping' },
  nature: { emoji: '🌿', label: 'Nature' },
  transport: { emoji: '🚌', label: 'Transport' },
  other: { emoji: '📍', label: 'Other' },
};

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'attraction', label: 'Attraction', emoji: '🎯' },
  { value: 'food', label: 'Food & Drink', emoji: '🍽️' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'transport', label: 'Transport', emoji: '🚌' },
  { value: 'other', label: 'Other', emoji: '📍' },
];

export default function StopDetailModal({
  stop,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(stop.notes || '');
  const [editCategory, setEditCategory] = useState<Category>(
    stop.category as Category
  );
  const [editStartTime, setEditStartTime] = useState(
    stop.start_time?.slice(0, 5) || ''
  );
  const [editDuration, setEditDuration] = useState(
    stop.duration_minutes?.toString() || ''
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const categoryConfig =
    CATEGORY_CONFIG[stop.category as Category] || CATEGORY_CONFIG.other;

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(stop.id, {
      notes: editNotes || null,
      category: editCategory,
      start_time: editStartTime || null,
      duration_minutes: editDuration ? parseInt(editDuration) : null,
    });
    setSaving(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(stop.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{categoryConfig.emoji}</span>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">
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
          {isEditing ? (
            <>
              {/* Edit Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setEditCategory(cat.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium ${
                        editCategory === cat.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-center leading-tight">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Edit Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this stop..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Tag className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {categoryConfig.label}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Start</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {stop.start_time
                      ? stop.start_time.slice(0, 5)
                      : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Timer className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {stop.duration_minutes
                      ? stop.duration_minutes < 60
                        ? `${stop.duration_minutes}m`
                        : `${Math.floor(stop.duration_minutes / 60)}h${
                            stop.duration_minutes % 60
                              ? ` ${stop.duration_minutes % 60}m`
                              : ''
                          }`
                      : '—'}
                  </p>
                </div>
              </div>

              {stop.notes ? (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-yellow-700 mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {stop.notes}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-sm">No notes added</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 text-sm mt-1 hover:underline"
                  >
                    Add notes
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  confirmDelete
                    ? 'bg-red-600 text-white'
                    : 'border border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? 'Confirm?' : 'Delete'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}