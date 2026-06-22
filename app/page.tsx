import Link from 'next/link';
import { MapPin, Calendar, Share2, Route } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Plan your perfect
            <span className="text-blue-600"> road trip</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Build your day-by-day itinerary, search for places, optimize your
            route, and share your adventure with friends.
          </p>
          <Link
            href="/signup"
            className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start planning for free
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Calendar className="w-8 h-8 text-blue-600" />,
              title: 'Day-by-day planning',
              desc: 'Organize your trip with a clear daily itinerary.',
            },
            {
              icon: <MapPin className="w-8 h-8 text-blue-600" />,
              title: 'Search any place',
              desc: 'Find places by name or address using Google Maps.',
            },
            {
              icon: <Route className="w-8 h-8 text-blue-600" />,
              title: 'Route optimization',
              desc: 'Automatically find the best order to visit your stops.',
            },
            {
              icon: <Share2 className="w-8 h-8 text-blue-600" />,
              title: 'Share your trip',
              desc: 'Share a read-only link with family and friends.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        Made with 🚗 Road Trippin' · Free forever
      </footer>
    </div>
  );
}