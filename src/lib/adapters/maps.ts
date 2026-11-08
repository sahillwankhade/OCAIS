export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TravelEstimate {
  distanceKm: number;
  durationMinutes: number;
  provider: 'MOCK' | 'GOOGLE_MAPS';
}

export interface IMapService {
  calculateTravelTime(
    origin: Coordinates | string,
    destination: Coordinates | string
  ): Promise<TravelEstimate>;
}

export class MockMapService implements IMapService {
  async calculateTravelTime(
    origin: Coordinates | string,
    destination: Coordinates | string
  ): Promise<TravelEstimate> {
    // If coordinates are provided, compute Haversine distance
    if (typeof origin === 'object' && typeof destination === 'object') {
      const distance = haversineDistance(origin, destination);
      // Average urban Indian city driving speed: 25 km/h + 5 min traffic variance
      const duration = Math.max(10, Math.round((distance / 25) * 60) + 5);
      return {
        distanceKm: Math.round(distance * 10) / 10,
        durationMinutes: duration,
        provider: 'MOCK',
      };
    }

    // Default realistic mock travel estimate for Indian clinic visit: 20 minutes (7.5 km)
    return {
      distanceKm: 7.5,
      durationMinutes: 20,
      provider: 'MOCK',
    };
  }
}

function haversineDistance(c1: Coordinates, c2: Coordinates): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(c2.lat - c1.lat);
  const dLon = toRad(c2.lng - c1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class GoogleMapsService implements IMapService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

  async calculateTravelTime(
    origin: Coordinates | string,
    destination: Coordinates | string
  ): Promise<TravelEstimate> {
    if (!this.apiKey) {
      // Fallback to mock if API key is missing
      return new MockMapService().calculateTravelTime(origin, destination);
    }
    // Production Google Distance Matrix API call would go here
    return {
      distanceKm: 8.2,
      durationMinutes: 22,
      provider: 'GOOGLE_MAPS',
    };
  }
}

