import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { OrgListRow } from './OrgShared';
import { OrganizationsMap } from './OrganizationsMap';
import { TaxonomyFilter } from './TaxonomyFilter';
import type { Organization } from '../lib/organizations';
import { ORG_KINDS } from '../lib/organizations';

const ALL_KIND_KEYS = Object.keys(ORG_KINDS);

export interface DirectoryMapItem {
  key: string;
  org: Organization;
  linkTo: string;
}

interface DirectoryMapLayoutProps {
  // Header
  searchDefault?: string;
  searchPlaceholder?: string;
  onSearchSubmit: (query: string) => void;
  filterContent?: ReactNode;
  activeFilterCount: number;
  by_type?: string;
  by_category?: string;
  by_subcategory?: string;
  onTaxonomyFilter: (params: { by_type?: string; by_category?: string; by_subcategory?: string }) => void;
  actionButton?: ReactNode;

  // List
  items: DirectoryMapItem[];
  totalCount: number;
  resultLabel?: string;
  isLoading: boolean;
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;

  // Map
  mapOrganizations: Organization[];
  mapLoading: boolean;
  selectedKinds: string[];
  mapLinkBuilder?: (org: { id: string; slug: string }) => string;
  mapCenter?: [number, number];
  mapRadiusKm?: number;
  maxBounds?: [[number, number], [number, number]];

  // Extra (modals, etc.)
  children?: ReactNode;
}

export function DirectoryMapLayout({
  searchDefault,
  searchPlaceholder = 'Search...',
  onSearchSubmit,
  filterContent,
  activeFilterCount,
  by_type,
  by_category,
  by_subcategory,
  onTaxonomyFilter,
  actionButton,
  items,
  totalCount,
  resultLabel = 'results',
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  mapOrganizations,
  mapLoading,
  selectedKinds,
  mapLinkBuilder,
  mapCenter,
  mapRadiusKm,
  maxBounds,
  children,
}: DirectoryMapLayoutProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  // Click-outside to close filter dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        filtersOpen &&
        filterRef.current && !filterRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filtersOpen]);

  // Infinite scroll observer
  const observerRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
    onSearchSubmit(q);
  };

  const effectiveKinds = selectedKinds.length > 0 ? selectedKinds : ALL_KIND_KEYS;

  return (
    <div className="flex flex-col h-full">
      {/* Page header — full width */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-white">
        <form onSubmit={handleSearchFormSubmit} className="relative w-[348px] shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            name="search"
            defaultValue={searchDefault || ''}
            placeholder={searchPlaceholder}
            className="w-full border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        {filterContent && (
          <div className="relative">
            <button
              ref={filterBtnRef}
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`relative border rounded-lg px-3 py-1.5 text-sm transition-colors ${
                filtersOpen || activeFilterCount > 0
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              }`}
              title="Filters"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75M10.5 18a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5m6-6h6.75M13.5 12a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12h7.5" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filtersOpen && (
              <div ref={filterRef} className="absolute top-full left-0 mt-2 z-50 w-80 border border-border rounded-lg bg-white p-4 space-y-4 shadow-lg">
                {filterContent}
              </div>
            )}
          </div>
        )}

        {/* Value chain taxonomy filter */}
        <div className="flex-1 min-w-0">
          <TaxonomyFilter
            activeType={by_type}
            activeCategory={by_category}
            activeSubcategory={by_subcategory}
            onFilter={(params) => onTaxonomyFilter({
              by_type: undefined,
              by_category: undefined,
              by_subcategory: undefined,
              ...params,
            })}
          />
        </div>

        {actionButton && (
          <div className="shrink-0">{actionButton}</div>
        )}
      </div>

      {/* Content — list + map */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — list */}
        <div className="w-[380px] flex-shrink-0 border-r border-border bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-4 text-muted-foreground">Loading...</p>}
            {!!error && <p className="p-4 text-destructive">Failed to load</p>}

            {!isLoading && !error && (
              <>
                <p className="px-4 pt-3 pb-2 text-sm text-muted-foreground">{totalCount} {resultLabel}</p>

                <div className="divide-y divide-border border-t border-border">
                  {items.map((item) => (
                    <OrgListRow
                      key={item.key}
                      org={item.org}
                      linkTo={item.linkTo}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="px-4 py-8 text-center text-muted-foreground">No {resultLabel} found</p>
                  )}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={observerRef} className="h-4" />
                {isFetchingNextPage && (
                  <p className="text-center text-sm text-muted-foreground py-2">Loading more...</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel — map */}
        <div className="flex-1 relative">
          {mapLoading && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading map...
            </div>
          )}
          {!mapLoading && (
            <OrganizationsMap
              organizations={mapOrganizations}
              selectedKinds={effectiveKinds}
              height="100%"
              linkBuilder={mapLinkBuilder}
              center={mapCenter}
              radiusKm={mapRadiusKm}
              maxBounds={maxBounds}
            />
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
