import type { ReactNode } from 'react';

/**
 * Shared empty state and loading skeletons for the explore pages
 * (Marketplace, Events, Directory).
 */

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
