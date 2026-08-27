import type { ReactNode } from 'react';
import { LayoutGrid, List, Map, Waypoints } from 'lucide-react';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../FeatureIntro';
import type { ViewMode } from '../../lib/explore';

const VIEW_MODES: { key: ViewMode; label: string; icon: ReactNode }[] = [
  { key: 'cards', label: 'Cards', icon: <LayoutGrid className="h-4 w-4" /> },
  { key: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
  { key: 'map', label: 'Map', icon: <Map className="h-4 w-4" /> },
  { key: 'graph', label: 'Graph', icon: <Waypoints className="h-4 w-4" /> },
];

export function ViewModeToggle({
  value,
  onChange,
  modes = ['cards', 'list', 'map'],
}: {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  modes?: ViewMode[];
}) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-white p-0.5">
      {VIEW_MODES.filter((m) => modes.includes(m.key)).map((mode) => (
        <button
          key={mode.key}
          type="button"
          title={mode.label}
          aria-label={mode.label}
          onClick={() => onChange(mode.key)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === mode.key
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {mode.icon}
          <span className="hidden lg:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Unified layout for the explore pages (Marketplace, Events, Directory):
 * filter sidebar on the left, header with result count + view toggle,
 * scrollable body for cards/list and full-bleed body for the map.
 */
export function ExploreShell({
  featureKey,
  title,
  description,
  action,
  filters,
  view,
  onViewChange,
  viewModes,
  resultCount,
  resultLabel,
  children,
}: {
  featureKey: string;
  title: string;
  description: string;
  action?: ReactNode;
  filters: ReactNode;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  viewModes?: ViewMode[];
  resultCount?: number;
  resultLabel: string;
  children: ReactNode;
}) {
  const info = useFeatureInfo(featureKey);

  return (
    <div className="flex h-full min-h-0">
      {/* Filter sidebar */}
      <aside className="w-72 shrink-0 border-r border-border bg-white overflow-y-auto p-4 space-y-5 hidden md:block">
        {filters}
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="px-5 py-3 border-b border-border bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-bold text-gray-900 truncate">{title}</h1>
              <FeatureInfoTrigger info={info} />
            </div>
            {resultCount !== undefined && (
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {resultCount} {resultLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {action}
            <ViewModeToggle value={view} onChange={onViewChange} modes={viewModes} />
          </div>
        </header>

        {view === 'map' || view === 'graph' ? (
          <div className="flex-1 min-h-0 relative">{children}</div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-5 space-y-4">
              <FeatureIntro info={info} title={title} description={description} />
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Fires fetchNextPage when scrolled into view (infinite scroll). */
export { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
