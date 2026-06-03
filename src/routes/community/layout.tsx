import { Outlet, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { FacilitatorPanelProvider, FacilitatorPanelSlot } from '../../components/FacilitatorPanel';

export function CommunityLayout() {
  const { communitySlug } = useParams({ strict: false }) as {
    communitySlug: string;
  };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin
  ) ?? false;

  return (
    <FacilitatorPanelProvider>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 bg-gray-50/50 overflow-y-auto">
          <Outlet />
        </div>
        {isAdmin && <FacilitatorPanelSlot />}
      </div>
    </FacilitatorPanelProvider>
  );
}
