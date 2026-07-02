'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trip } from '@/lib/types';
import {
  ArrowLeft,
  Share2,
  Check,
  Copy,
  Globe,
  GlobeLock,
  BookOpen,
} from 'lucide-react';

interface Props {
  trip: Trip;
  onToggleShare: () => void;
  onBack: () => void;
}

export default function Navbar({ trip, onToggleShare, onBack }: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${
    typeof window !== 'undefined' ? window.location.origin : ''
  }/share/${trip.share_token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚗</span>
          <span className="font-bold text-gray-900 hidden sm:block">
            Road Trippin'
          </span>
        </div>
        <span className="text-gray-300">|</span>
        <h1 className="font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-xs">
          {trip.name}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 relative">
        <Link
          href={`/trip/${trip.id}/journal`}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:block">Journal</span>
        </Link>
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:block">Share</span>
        </button>

        {/* Share Dropdown */}
        {showShareMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowShareMenu(false)}
            />
            <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-80 z-20">
              <h3 className="font-bold text-gray-900 mb-1">Share Trip</h3>
              <p className="text-sm text-gray-500 mb-4">
                Let others view your itinerary.
              </p>

              {/* Toggle */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  {trip.share_enabled ? (
                    <Globe className="w-4 h-4 text-green-600" />
                  ) : (
                    <GlobeLock className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {trip.share_enabled
                      ? 'Sharing enabled'
                      : 'Sharing disabled'}
                  </span>
                </div>
                <button
                  onClick={onToggleShare}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    trip.share_enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      trip.share_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Share Link */}
              {trip.share_enabled && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Share link:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded-lg text-gray-700 truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1"
                    >
                      {copied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}