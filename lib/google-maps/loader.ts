import { Loader } from '@googlemaps/js-api-loader';

let isLoaded = false;

export const loadGoogleMaps = async () => {
  if (isLoaded) return;
  
  try {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places', 'geometry', 'routes'],
    });
    
    await loader.load();
    isLoaded = true;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
  }
};

export const getGoogleMapsLoader = () => {
  return new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    version: 'weekly',
    libraries: ['places', 'geometry', 'routes'],
  });
};
