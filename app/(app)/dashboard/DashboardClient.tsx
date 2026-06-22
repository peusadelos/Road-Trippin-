'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Calendar, Share2, Trash2 } from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

interface DashboardClientProps {
  trips: Trip[];
  profile: Profile | null;
}

export default function DashboardClient({ trips, profile }: DashboardClientProps) {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <span className="text-xl font-bold text-gray-900">
                Road Trippin'
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {profile?.full_name || 'User'}
              </span>
              <Link
                href="/api/auth/logout"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Log out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Road Trips
            </h1>
            <p className="text-gray-600 mt-2">
              {trips.length} trip{trips.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </Link>
        </div>

        {/* Trips Grid */}
        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/dashboard/trip/${trip.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {trip.title}
                  </h3>
                  {trip.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {trip.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(trip.start_date).toLocaleDateString()} -{' '}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No trips yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first road trip to get started!
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create First Trip
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
