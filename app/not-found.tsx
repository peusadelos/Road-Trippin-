import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl">🗺️</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Page not found
        </h1>
        <p className="text-gray-500 mt-2">
          This trip doesn't exist or sharing has been disabled.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
        >
          Go to Road Trippin'
        </Link>
      </div>
    </div>
  );
}