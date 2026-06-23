import { Loader } from '@googlemaps/js-api-loader';

let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = async () => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Check if Google Maps is already loaded
  if ((window as any).google?.maps) {
    return Promise.resolve();
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        reject(error);
      });
  });

  return googleMapsPromise;
};

export const getGoogleMapsLoader = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as any).google?.maps || null;
};
