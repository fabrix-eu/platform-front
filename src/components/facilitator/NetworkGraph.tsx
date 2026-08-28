import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { getNetworkGraph, HEALTH_LEVELS } from '../../lib/networks';
import { ORG_KINDS } from '../../lib/organizations';
import { RELATION_TYPES } from '../../lib/relations';

interface GraphNode {
  id: string; // organization_id (link endpoints reference organizations)
  norgId: string;
  name: string;
  kind: string | null;
  workers: number | null;
  health: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relation_type: string;
  kind: string;
}

/** Node radius from the organization's workforce (sqrt scale, clamped). */
function nodeRadius(workers: number | null): number {
  if (!workers || workers <= 0) return 5;
  return Math.min(16, 5 + Math.sqrt(workers));
}

export function NetworkGraph({ networkSlug }: { networkSlug: string }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const didFitRef = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  const graphQuery = useQuery({
    queryKey: ['network_graph', networkSlug],
    queryFn: () => getNetworkGraph(networkSlug),
  });

  // Track the container size for the canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const raw = graphQuery.data;
    if (!raw) return { nodes: [], links: [] };
    const nodes: GraphNode[] = raw.nodes.map((n) => ({
      id: n.organization_id,
      norgId: n.id,
      name: n.name,
      kind: n.kind,
      workers: n.number_of_workers,
      health: n.economic_health,
    }));
    const ids = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = raw.links.filter(
      (l) => ids.has(l.source as string) && ids.has(l.target as string),
    );
    return { nodes, links };
  }, [graphQuery.data]);

  const neighborIds = useMemo(() => {
    if (!hoverNode) return null;
    const ids = new Set<string>([hoverNode.id]);
    for (const link of data.links) {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      if (s === hoverNode.id) ids.add(t);
      if (t === hoverNode.id) ids.add(s);
    }
    return ids;
  }, [hoverNode, data.links]);

  return (
    <div ref={containerRef} className="h-full w-full relative bg-white">
      {graphQuery.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Loading graph…</div>
      )}
      {size.width > 0 && size.height > 0 && (
        <ForceGraph2D
          ref={graphRef}
          width={size.width}
          height={size.height}
          onEngineStop={() => {
            if (!didFitRef.current && data.nodes.length > 0) {
              didFitRef.current = true;
              graphRef.current?.zoomToFit(400, 40);
            }
          }}
          graphData={data}
          nodeRelSize={1}
          nodeVal={(node) => nodeRadius((node as GraphNode).workers) ** 2}
          nodeLabel={() => ''}
          onNodeHover={(node) => setHoverNode((node as GraphNode) ?? null)}
          onNodeClick={(node) => {
            navigate({
              to: '/facilitator/network/$norgId',
              params: { norgId: (node as GraphNode).norgId },
              search: { network: networkSlug },
            });
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode;
            const r = nodeRadius(n.workers);
            const dimmed = neighborIds ? !neighborIds.has(n.id) : false;

            ctx.globalAlpha = dimmed ? 0.15 : 1;
            ctx.beginPath();
            ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
            ctx.fillStyle = ORG_KINDS[n.kind ?? '']?.hex ?? '#6B7280';
            ctx.fill();

            // Fragile orgs get an alert ring
            if (n.health === 'warning' || n.health === 'critical') {
              ctx.lineWidth = 1.5 / globalScale + 1;
              ctx.strokeStyle = n.health === 'critical' ? '#dc2626' : '#d97706';
              ctx.stroke();
            } else {
              ctx.lineWidth = 1;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            }

            // Label when zoomed in or highlighted
            if (globalScale > 1.4 || (neighborIds && neighborIds.has(n.id))) {
              const fontSize = Math.max(10 / globalScale, 2.5);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = '#374151';
              ctx.fillText(n.name, n.x!, n.y! + r + 1.5);
            }
            ctx.globalAlpha = 1;
          }}
          linkColor={(link) => {
            const l = link as GraphLink;
            const hex = RELATION_TYPES[l.relation_type]?.hex ?? '#9ca3af';
            if (!neighborIds) return hex;
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return neighborIds.has(s) && neighborIds.has(t) ? hex : `${hex}20`;
          }}
          linkWidth={(link) => ((link as GraphLink).kind === 'potential' ? 1 : 1.6)}
          linkLineDash={(link) => ((link as GraphLink).kind === 'potential' ? [3, 3] : null)}
          cooldownTicks={120}
          d3VelocityDecay={0.35}
        />
      )}

      {/* Hover tooltip */}
      {hoverNode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 border border-border rounded-lg shadow-sm px-3 py-1.5 text-sm text-gray-800 flex items-center gap-2 pointer-events-none">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: ORG_KINDS[hoverNode.kind ?? '']?.hex ?? '#6B7280' }}
          />
          <span className="font-medium">{hoverNode.name}</span>
          {hoverNode.workers != null && <span className="text-xs text-gray-400">{hoverNode.workers} workers</span>}
          {hoverNode.health !== 'unknown' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${HEALTH_LEVELS[hoverNode.health]?.badgeColor}`}>
              {HEALTH_LEVELS[hoverNode.health]?.label}
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-border rounded-lg shadow-sm px-3 py-2 space-y-1 max-h-64 overflow-y-auto">
        {Object.entries(RELATION_TYPES).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-gray-700">
            <span className="w-4 h-0.5 shrink-0" style={{ background: cfg.hex }} />
            {cfg.label}
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-border">
          <span className="w-4 border-t border-dashed border-gray-400 shrink-0" />
          Potential (suggested)
        </div>
      </div>

      {!graphQuery.isLoading && data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          No organizations to display yet.
        </div>
      )}
    </div>
  );
}
