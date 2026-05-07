import { useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
  CATEGORIES_BY_TYPE,
  getListings,
} from '../lib/listings';
import { getOrganizations } from '../lib/organizations';

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  material: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', accent: 'bg-emerald-500' },
  capacity: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', accent: 'bg-amber-500' },
  service: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-500' },
  product: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', accent: 'bg-rose-500' },
  distribution: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', accent: 'bg-violet-500' },
};

const CHAIN_ORDER = ['material', 'capacity', 'service', 'product', 'distribution'];

const FLOW_LABELS = ['processed by', 'enables', 'creates', 'distributed via'];

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 shrink-0">
      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
      <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

function CategoryCard({
  catKey,
  listingCount,
  orgCount,
}: {
  catKey: string;
  listingCount: number;
  orgCount: number;
}) {
  const cat = LISTING_CATEGORIES[catKey];
  const subcategories = LISTING_SUBCATEGORIES[catKey] ?? {};
  const hasSubcategories = Object.keys(subcategories).length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight ${cat.badgeColor}`}>
          {cat.label}
        </span>
        <div className="flex gap-1 shrink-0">
          {listingCount > 0 && (
            <span className="text-[9px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded font-medium">
              {listingCount}L
            </span>
          )}
          {orgCount > 0 && (
            <span className="text-[9px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded font-medium">
              {orgCount}O
            </span>
          )}
        </div>
      </div>

      {hasSubcategories && (
        <div className="flex flex-wrap gap-0.5 mt-1.5">
          {Object.entries(subcategories).map(([subKey, sub]) => (
            <span
              key={subKey}
              className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 px-1 py-0.5 rounded leading-tight"
            >
              {sub.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeZone({
  typeKey,
  listingCounts,
  orgCounts,
}: {
  typeKey: string;
  listingCounts: Record<string, number>;
  orgCounts: Record<string, number>;
}) {
  const type = LISTING_TYPES[typeKey];
  const colors = TYPE_COLORS[typeKey];
  const categories = CATEGORIES_BY_TYPE[typeKey] ?? [];

  const totalListings = categories.reduce((sum, cat) => sum + (listingCounts[cat] || 0), 0);
  const totalOrgs = categories.reduce((sum, cat) => sum + (orgCounts[cat] || 0), 0);

  return (
    <div className={`w-72 shrink-0 rounded-xl border-2 ${colors.border} ${colors.bg} p-3`}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.accent}`} />
        <h3 className={`text-xs font-bold truncate ${colors.text}`}>{type.label}</h3>
      </div>

      <div className="flex gap-3 mb-2 text-center">
        <div>
          <p className={`text-sm font-bold ${colors.text}`}>{totalListings}</p>
          <p className="text-[9px] text-gray-500">Listings</p>
        </div>
        <div>
          <p className={`text-sm font-bold ${colors.text}`}>{totalOrgs}</p>
          <p className="text-[9px] text-gray-500">Orgs</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {categories.map((catKey) => (
          <CategoryCard
            key={catKey}
            catKey={catKey}
            listingCount={listingCounts[catKey] || 0}
            orgCount={orgCounts[catKey] || 0}
          />
        ))}
      </div>
    </div>
  );
}

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    state.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    state.current.isDown = false;
    el.style.cursor = 'grab';
    el.style.userSelect = '';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !state.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = state.current.scrollLeft - (x - state.current.startX);
  }, []);

  return { ref, onMouseDown, onMouseUp, onMouseLeave: onMouseUp, onMouseMove };
}

export function ValueChainPage() {
  const listings = useQuery({
    queryKey: ['value-chain', 'listings'],
    queryFn: () => getListings({ per_page: 999 }),
  });

  const orgs = useQuery({
    queryKey: ['value-chain', 'organizations'],
    queryFn: () => getOrganizations({ per_page: 999 }),
  });

  const listingCounts: Record<string, number> = {};
  if (listings.data?.data) {
    for (const listing of listings.data.data) {
      listingCounts[listing.category] = (listingCounts[listing.category] || 0) + 1;
    }
  }

  const orgCounts: Record<string, number> = {};
  if (orgs.data?.organizations) {
    for (const org of orgs.data.organizations) {
      const specialties = org.specialties ?? [];
      for (const spec of specialties) {
        if (LISTING_CATEGORIES[spec]) {
          orgCounts[spec] = (orgCounts[spec] || 0) + 1;
        }
      }
    }
  }

  const isLoading = listings.isLoading || orgs.isLoading;
  const drag = useDragScroll();

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Circular Textile Value Chain</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Each column represents a stage of the value chain — from raw materials to distribution.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-5 bg-white rounded-lg border border-gray-200 px-3 py-2">
        {CHAIN_ORDER.map((typeKey, i) => {
          const colors = TYPE_COLORS[typeKey];
          return (
            <div key={typeKey} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300 text-xs mr-1">&rarr;</span>}
              <div className={`w-2 h-2 rounded-full ${colors.accent}`} />
              <span className="text-[11px] font-medium text-gray-700">{LISTING_TYPES[typeKey].label}</span>
            </div>
          );
        })}
      </div>

      <div
        ref={drag.ref}
        onMouseDown={drag.onMouseDown}
        onMouseUp={drag.onMouseUp}
        onMouseLeave={drag.onMouseLeave}
        onMouseMove={drag.onMouseMove}
        className="overflow-x-auto pb-4 cursor-grab [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        {isLoading ? (
          <div className="flex items-start gap-3">
            {CHAIN_ORDER.map((typeKey) => (
              <div
                key={typeKey}
                className={`w-72 shrink-0 rounded-xl border-2 ${TYPE_COLORS[typeKey].border} ${TYPE_COLORS[typeKey].bg} p-3 animate-pulse`}
              >
                <div className="h-3 bg-gray-200 rounded w-16 mb-3" />
                <div className="space-y-1.5">
                  {(CATEGORIES_BY_TYPE[typeKey] ?? []).map((cat) => (
                    <div key={cat} className="h-14 bg-white/60 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-1">
            {CHAIN_ORDER.map((typeKey, i) => (
              <div key={typeKey} className="contents">
                <TypeZone
                  typeKey={typeKey}
                  listingCounts={listingCounts}
                  orgCounts={orgCounts}
                />
                {i < CHAIN_ORDER.length - 1 && (
                  <FlowArrow label={FLOW_LABELS[i]} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
