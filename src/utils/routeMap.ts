/**
 * Zimbabwe city approx coords for transport map embeds
 */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  harare: { lat: -17.8292, lon: 31.0522 },
  bulawayo: { lat: -20.1325, lon: 28.6265 },
  mutare: { lat: -18.9707, lon: 32.6709 },
  gweru: { lat: -19.4500, lon: 29.8167 },
  masvingo: { lat: -20.0637, lon: 30.8277 },
  chitungwiza: { lat: -18.0127, lon: 31.0756 },
  kadoma: { lat: -18.3333, lon: 29.9167 },
  kwekwe: { lat: -18.9281, lon: 29.8149 },
};

function resolveCity(text?: string) {
  if (!text) return CITY_COORDS.harare;
  const lower = text.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return CITY_COORDS.harare;
}

/** Build an OpenStreetMap embed URL spanning pickup → delivery */
export function buildRouteMapEmbed(pickup?: string, delivery?: string): string {
  const a = resolveCity(pickup);
  const b = resolveCity(delivery);
  const minLon = Math.min(a.lon, b.lon) - 0.15;
  const maxLon = Math.max(a.lon, b.lon) + 0.15;
  const minLat = Math.min(a.lat, b.lat) - 0.12;
  const maxLat = Math.max(a.lat, b.lat) + 0.12;
  const midLat = (a.lat + b.lat) / 2;
  const midLon = (a.lon + b.lon) / 2;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${midLat}%2C${midLon}`;
}

export function estimateArrivalLabel(status: string): string {
  if (status === 'completed') return 'Delivered';
  if (status === 'in_progress') return 'Arriving within 2 hours';
  if (status === 'accepted') return 'Pickup scheduled today';
  return 'Awaiting assignment';
}
