import { useNavigationContext } from './useNavigationContext';

/**
 * Shared conventions for the three explore pages (Marketplace, Events,
 * Directory): view modes, the "Near + radius" location filter and its
 * default-to-"Me" behaviour.
 */

export type ViewMode = 'cards' | 'list' | 'map';

export const DEFAULT_RADIUS_KM = 100;
export const RADIUS_OPTIONS = [25, 50, 100, 200, 500];

export const EUROPE_BOUNDS: [[number, number], [number, number]] = [[-11, 34], [45, 58]];

/** URL search params shared by every explore page. */
export interface ExploreLocationSearch {
  /** 'all' = the user explicitly cleared the default "Me" filter. */
  near?: 'all';
  lon?: number;
  lat?: number;
  radius?: number;
  location_label?: string;
  country?: string;
}

export interface MyLocation {
  lon: number;
  lat: number;
  label: string;
}

export interface ResolvedLocation {
  /** Whether a near+radius filter applies to the query. */
  active: boolean;
  /** The active location is the current organization's address. */
  isMe: boolean;
  lon?: number;
  lat?: number;
  radius: number;
  label?: string;
}

/** The current organization's coordinates (from /me), or null. */
export function useMyOrgLocation(): MyLocation | null {
  const { currentOrg } = useNavigationContext();
  if (!currentOrg || currentOrg.organization_lon == null || currentOrg.organization_lat == null) {
    return null;
  }
  return {
    lon: currentOrg.organization_lon,
    lat: currentOrg.organization_lat,
    label: currentOrg.organization_address || currentOrg.organization_name,
  };
}

/**
 * Resolve the effective location filter from the URL:
 * - explicit lon/lat in the URL → that place
 * - `near=all` → filter cleared
 * - nothing → defaults to "Me" (current org address) when available
 */
export function resolveLocation(
  search: ExploreLocationSearch,
  myLocation: MyLocation | null,
): ResolvedLocation {
  const radius = search.radius ?? DEFAULT_RADIUS_KM;

  if (search.lon !== undefined && search.lat !== undefined) {
    return { active: true, isMe: false, lon: search.lon, lat: search.lat, radius, label: search.location_label };
  }
  if (search.near === 'all' || !myLocation) {
    return { active: false, isMe: false, radius };
  }
  return { active: true, isMe: true, lon: myLocation.lon, lat: myLocation.lat, radius, label: myLocation.label };
}

/** Geo params to spread into an API call (libs build within_distance[...] themselves). */
export function geoApiParams(
  location: ResolvedLocation,
  country?: string,
): { lon?: number; lat?: number; radius?: number; country?: string } {
  return {
    country,
    ...(location.active ? { lon: location.lon, lat: location.lat, radius: location.radius } : {}),
  };
}
