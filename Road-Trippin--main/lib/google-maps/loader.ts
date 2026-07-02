import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let mapsInitialized = false;

export const loadGoogleMaps = async () => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (mapsInitialized) {
    return Promise.resolve();
  }

  if ((window as any).google?.maps) {
    return Promise.resolve();
  }

  try {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' });
    await importLibrary('maps');
    await importLibrary('places');
    await importLibrary('geometry');
    mapsInitialized = true;
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    throw error;
  }
};

export const getGoogleMapsLoader = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as any).google?.maps || null;
};
