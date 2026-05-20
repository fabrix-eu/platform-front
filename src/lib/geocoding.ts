const PHOTON_URL = 'https://photon.komoot.io';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export interface GeocodingSuggestion {
  id: string;
  label: string;
  lat: number;
  lon: number;
  address: string;
  city?: string;
  country_code?: string;
  country_name?: string;
  postal_code?: string;
}

function buildLabel(props: PhotonFeature['properties']): string {
  const parts: string[] = [];

  if (props.housenumber && props.street) {
    parts.push(`${props.street} ${props.housenumber}`);
  } else if (props.street) {
    parts.push(props.street);
  } else if (props.name) {
    parts.push(props.name);
  }

  if (props.postcode && props.city) {
    parts.push(`${props.postcode} ${props.city}`);
  } else if (props.city) {
    parts.push(props.city);
  }

  if (props.country) {
    parts.push(props.country);
  }

  return parts.join(', ');
}

function featureToSuggestion(
  feature: PhotonFeature,
  index: number,
): GeocodingSuggestion {
  const [lon, lat] = feature.geometry.coordinates;
  const props = feature.properties;
  const label = buildLabel(props);

  return {
    id: `photon-${index}`,
    label,
    lat,
    lon,
    address: label,
    city: props.city,
    country_code: props.countrycode?.toLowerCase(),
    country_name: props.country,
    postal_code: props.postcode,
  };
}

export async function searchAddress(
  query: string,
  limit = 5,
): Promise<GeocodingSuggestion[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${PHOTON_URL}/api?${params}`);
  if (!res.ok) return [];
  const data: PhotonResponse = await res.json();
  return data.features.map(featureToSuggestion);
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<GeocodingSuggestion | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  const res = await fetch(`${PHOTON_URL}/reverse?${params}`);
  if (!res.ok) return null;
  const data: PhotonResponse = await res.json();
  if (data.features.length === 0) return null;
  return featureToSuggestion(data.features[0], 0);
}

export async function searchCity(
  query: string,
  limit = 5,
): Promise<GeocodingSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    osm_tag: 'place:city',
  });
  const res = await fetch(`${PHOTON_URL}/api?${params}`);
  if (!res.ok) return [];
  const data: PhotonResponse = await res.json();

  if (data.features.length === 0) {
    const fallbackParams = new URLSearchParams({
      q: query,
      limit: String(limit),
      osm_tag: 'place:town',
    });
    const fallbackRes = await fetch(`${PHOTON_URL}/api?${fallbackParams}`);
    if (!fallbackRes.ok) return [];
    const fallbackData: PhotonResponse = await fallbackRes.json();
    return fallbackData.features.map(featureToSuggestion);
  }

  return data.features.map(featureToSuggestion);
}
