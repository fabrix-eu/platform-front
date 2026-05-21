import { Outlet } from '@tanstack/react-router';
import { TabBar, type TabItem } from '../../components/TabBar';

const tabs: TabItem[] = [
  { key: 'overview', label: 'Overview', path: '/global' },
  { key: 'events', label: 'Events', path: '/events' },
  { key: 'challenges', label: 'Challenges', path: '/challenges' },
  { key: 'marketplace', label: 'Marketplace', path: '/marketplace', badge: 'new' },
];

export function GlobalLayout() {
  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <div className="border-b border-border bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-display font-bold text-gray-900">Global</h1>
        </div>
        <TabBar tabs={tabs} />
      </div>

      <div className="flex-1 min-h-0 bg-gray-50/50 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
