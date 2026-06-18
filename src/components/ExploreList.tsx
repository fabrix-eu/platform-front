import type { ReactNode } from 'react';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from './FeatureIntro';

/**
 * Shared scaffolding for the public "Explore" list pages
 * (Marketplace, Events, Challenges). Keeps their width, header, search,
 * empty state, skeletons and pagination identical — the page only provides
 * its filters, cards and search-param wiring.
 */

// ── Page shell: consistent width + header + feature intro ────────────────
export function ExploreListLayout({
  featureKey,
  title,
  description,
  action,
  children,
}: {
  featureKey: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const info = useFeatureInfo(featureKey);
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <FeatureInfoTrigger info={info} />
        </div>
        {action}
      </div>

      <FeatureIntro info={info} title={title} description={description} />

      {children}
    </div>
  );
}

// ── Uncontrolled search input + button (FormData, server is authority) ───
export function SearchBar({
  defaultValue,
  placeholder,
  onSearch,
}: {
  defaultValue?: string;
  placeholder: string;
  onSearch: (value: string) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSearch((fd.get('search') as string) || '');
      }}
      className="flex gap-2"
    >
      <input
        name="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary/80"
      >
        Search
      </button>
    </form>
  );
}

// ── Empty state card ─────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
      <div className="flex justify-center text-gray-400">{icon}</div>
      <h3 className="font-display font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{message}</p>
    </div>
  );
}

// ── Loading skeletons ────────────────────────────────────────────────────
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse bg-white border border-border rounded-lg p-4 flex gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse bg-white border border-border rounded-lg overflow-hidden">
          <div className="aspect-[16/10] bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="flex gap-2">
              <div className="h-5 bg-gray-200 rounded-full w-14" />
              <div className="h-5 bg-gray-200 rounded-full w-24" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────
// The caller supplies the route-typed <Link> via renderLink so TanStack's
// type-safe routing is preserved; this owns the layout and prev/next logic.
export const PAGINATION_LINK_CLASS = 'text-sm text-muted-foreground hover:text-foreground';

export interface PageMeta {
  current_page: number;
  total_pages: number;
  prev_page: number | null;
  next_page: number | null;
}

export function Pagination({
  meta,
  renderLink,
}: {
  meta: PageMeta | undefined;
  renderLink: (page: number, label: ReactNode) => ReactNode;
}) {
  if (!meta || meta.total_pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4">
      {meta.prev_page && renderLink(meta.prev_page, <>&larr; Previous</>)}
      <span className="text-sm text-muted-foreground">
        Page {meta.current_page} of {meta.total_pages}
      </span>
      {meta.next_page && renderLink(meta.next_page, <>Next &rarr;</>)}
    </div>
  );
}
