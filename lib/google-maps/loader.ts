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
  const loader = getGoogleMapsLoader();
  await loader.loadPromise;
  isLoaded = true;
};
