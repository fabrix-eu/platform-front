import type { Organization } from '../lib/organizations';
import { ORG_KINDS } from '../lib/organizations';
import { PointsMap, type MapPoint, type MapRelationLine } from './explore/PointsMap';

export type { MapRelationLine };

interface OrganizationsMapProps {
  organizations: Organization[];
  height?: string;
  selectedKinds: string[];
  linkBuilder?: (org: { id: string; slug: string }) => string;
  relations?: MapRelationLine[];
  highlightOrgId?: string;
  center?: [number, number];
  radiusKm?: number;
  maxBounds?: [[number, number], [number, number]];
}

function getKindColor(kind: string | null): string {
  return ORG_KINDS[kind ?? '']?.hex ?? '#6B7280';
}

/** Thin wrapper mapping Organization[] onto the generic PointsMap. */
export function OrganizationsMap({
  organizations,
  height = '500px',
  selectedKinds,
  linkBuilder,
  relations,
  highlightOrgId,
  center,
  radiusKm,
  maxBounds,
}: OrganizationsMapProps) {
  const points: MapPoint[] = organizations
    .filter(
      (org) =>
        org.lat != null && org.lon != null &&
        (selectedKinds.length === 0 || (org.kind && selectedKinds.includes(org.kind))),
    )
    .map((org) => ({
      id: org.id,
      lon: org.lon!,
      lat: org.lat!,
      color: getKindColor(org.kind),
      title: org.name,
      subtitle: org.address || undefined,
      href: linkBuilder
        ? linkBuilder({ id: org.id, slug: org.slug ?? org.id })
        : `/organizations/${org.slug || org.id}`,
    }));

  return (
    <PointsMap
      points={points}
      height={height}
      relations={relations}
      highlightId={highlightOrgId}
      center={center}
      radiusKm={radiusKm}
      maxBounds={maxBounds}
    />
  );
}
