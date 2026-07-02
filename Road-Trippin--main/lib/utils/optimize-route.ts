import { Stop } from '../types';

// Helper function to get latitude safely
function getLat(stop: Stop): number {
  return (stop.lat ?? stop.latitude) || 0;
}

// Helper function to get longitude safely
function getLng(stop: Stop): number {
  return (stop.lng ?? stop.longitude) || 0;
}

// Calculate distance between two coordinates (Haversine formula)
export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function totalDistance(stops: Stop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += getDistance(
      getLat(stops[i]),
      getLng(stops[i]),
      getLat(stops[i + 1]),
      getLng(stops[i + 1])
    );
  }
  return total;
}

function nearestNeighbor(stops: Stop[]): Stop[] {
  if (stops.length <= 2) return stops;
  const unvisited = [...stops];
  const route: Stop[] = [];
  route.push(unvisited.shift()!);

  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    unvisited.forEach((stop, index) => {
      const dist = getDistance(
        getLat(current),
        getLng(current),
        getLat(stop),
        getLng(stop)
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = index;
      }
    });

    route.push(unvisited.splice(nearestIndex, 1)[0]);
  }

  return route;
}

function twoOpt(stops: Stop[]): Stop[] {
  if (stops.length <= 3) return stops;

  let improved = true;
  let bestRoute = [...stops];
  let bestDistance = totalDistance(bestRoute);

  while (improved) {
    improved = false;

    for (let i = 1; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1),
        ];

        const newDistance = totalDistance(newRoute);

        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

export function optimizeRoute(stops: Stop[]): Stop[] {
  if (stops.length <= 1) return stops;

  const nnRoute = nearestNeighbor(stops);
  const optimizedRoute = twoOpt(nnRoute);

  return optimizedRoute.map((stop, index) => ({
    ...stop,
    sort_order: index,
  }));
}
