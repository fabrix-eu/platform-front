import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '../lib/auth';
import { OrgSwitcher } from '../components/OrgSwitcher';
import { NotificationBell } from '../components/NotificationBell';
import { MessageBell } from '../components/MessageBell';
import { AppRail } from '../components/AppRail';
import { ContextualSidebar } from '../components/ContextualSidebar';
import { useRefreshOnNavigate } from '../lib/notifications';

export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });

  const authed = !!me.data;

  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const isDocs = pathname === '/docs';

  useRefreshOnNavigate();

  const handleLogout = async () => {
    await logout();
    queryClient.setQueryData(['me'], null);
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const showNav = authed && !isAdmin && !isDocs;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border h-14 flex items-center">
        <div className="px-4 h-full flex items-center">
          {authed && me.data && me.data.organizations.length > 0 ? (
            <OrgSwitcher />
          ) : (
            <Link to="/" className="text-lg font-display font-bold text-primary">
              Fabrix
            </Link>
          )}
        </div>

        <div className="flex-1 flex items-center justify-end gap-4 px-6">
          {authed && <MessageBell />}
          {authed && <NotificationBell />}
          {authed && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <main className="flex h-[calc(100vh-56px)]">
        {showNav && <AppRail />}
        {showNav && <ContextualSidebar />}
        <div className="flex-1 min-w-0 h-full overflow-auto flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
