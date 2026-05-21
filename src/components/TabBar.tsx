import { Link, useLocation } from '@tanstack/react-router';

export interface TabItem {
  key: string;
  label: string;
  path: string;
  badge?: string;
}

interface TabBarProps {
  tabs: TabItem[];
  overviewKey?: string;
}

export function TabBar({ tabs, overviewKey = 'overview' }: TabBarProps) {
  const { pathname } = useLocation();

  function isActive(tab: TabItem) {
    if (tab.key === overviewKey) return pathname === tab.path || pathname === `${tab.path}/`;
    return pathname.startsWith(tab.path);
  }

  return (
    <div className="flex gap-1 px-6">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          to={tab.path}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            isActive(tab)
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.badge && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none rounded-full bg-primary/10 text-primary">
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
