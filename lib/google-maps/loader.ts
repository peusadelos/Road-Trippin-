import { Loader } from '@googlemaps/js-api-loader';

let loader: Loader | null = null;
let isLoaded = false;

export const getGoogleMapsLoader = () => {
  if (!loader) {
    loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places', 'geometry', 'routes'],
    });
  }
  return loader;
};

export const loadGoogleMaps = async () => {
  if (isLoaded) return;
  
  try {
    const loader = getGoogleMapsLoader();
    // Simply importing the library is enough to load it
    await loader.importLibrary('maps');
    isLoaded = true;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    // Don't throw - let the app continue without maps
  }
};
