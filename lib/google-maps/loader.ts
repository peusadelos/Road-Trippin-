import { Loader } from '@googlemaps/js-api-loader';

let googleMapsPromise: Promise<typeof google> | null = null;

export const loadGoogleMaps = async (): Promise<typeof google | void> => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Check if Google Maps is already loaded
  if ((window as any).google?.maps) {
    return (window as any).google;
  }

  googleMapsPromise = new Promise(async (resolve, reject) => {
    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places', 'geometry'],
      });

      const google = await (loader as any).load();
      resolve(google);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      reject(error);
    }
  });

  return googleMapsPromise;
};

export const getGoogleMapsLoader = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as any).google?.maps || null;
};
