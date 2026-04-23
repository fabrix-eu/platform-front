import { Link, Outlet, useMatches } from '@tanstack/react-router';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';

const tabs = [
  { label: 'Rotterdam', to: '/data/rotterdam' as const },
  { label: 'Athens', to: '/data/athens' as const },
];

export function DataLayout() {
  const dataInfo = useFeatureInfo('city-data');
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? '';

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-white px-6 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-lg font-semibold font-display">Data</h1>
          <FeatureInfoTrigger info={dataInfo} />
        </div>
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const isActive = currentPath.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <FeatureIntro
          info={dataInfo}
          title="City Data"
          description="Explore interactive maps and statistics about the textile industry at city level. Visualize company density, sector distribution, and economic trends across European cities."
        />
        <Outlet />
      </div>
    </div>
  );
}
