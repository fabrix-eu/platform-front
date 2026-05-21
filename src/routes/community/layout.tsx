import { Outlet, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { FacilitatorPanelProvider, FacilitatorPanelSlot } from '../../components/FacilitatorPanel';
import { TabBar, type TabItem } from '../../components/TabBar';

export function CommunityLayout() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin
  ) ?? false;

  const basePath = `/${orgSlug}/communities/${communitySlug}`;

  const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', path: basePath },
    { key: 'events', label: 'Events', path: `${basePath}/events` },
    { key: 'challenges', label: 'Challenges', path: `${basePath}/challenges` },
    { key: 'marketplace', label: 'Marketplace', path: `${basePath}/marketplace`, badge: 'new' },
    { key: 'matchmaking', label: 'Matchmaking', path: `${basePath}/matchmaking` },
    ...(isAdmin ? [
      { key: 'join-requests', label: 'Join Requests', path: `${basePath}/join-requests` },
      { key: 'settings', label: 'Settings', path: `${basePath}/settings` },
    ] : []),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Community header with tabs */}
      <div className="border-b border-border bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-display font-bold text-gray-900">
            {meQuery.data?.accessible_communities?.find((c) => c.slug === communitySlug)?.name ?? communitySlug}
          </h1>
        </div>
        <TabBar tabs={tabs} />
      </div>

      {/* Content */}
      <FacilitatorPanelProvider>
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 bg-gray-50/50 overflow-y-auto">
            <Outlet />
          </div>
          {isAdmin && <FacilitatorPanelSlot />}
        </div>
      </FacilitatorPanelProvider>
    </div>
  );
}
