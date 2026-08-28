import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '../lib/auth';
import { OrgSwitcher } from '../components/OrgSwitcher';
import { NotificationBell } from '../components/NotificationBell';
import { MessageBell } from '../components/MessageBell';
import { AppSidebar } from '../components/AppSidebar';
import { useRefreshOnNavigate } from '../lib/notifications';

export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
        {showNav && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden px-4 h-full flex items-center text-gray-500 hover:text-gray-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
        <div className="px-4 h-full flex items-center">
          {authed && me.data && me.data.organizations.length > 0 ? (
            <OrgSwitcher />
          ) : (
            <Link to="/" className="flex items-center">
              <img src="/fabrix-logo.svg" alt="FABRIX" className="h-5 w-auto" />
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
        {showNav && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/30"
                  onClick={() => setSidebarOpen(false)}
                />
                <AppSidebar className="absolute left-0 top-0 h-full z-50 shadow-xl" />
              </div>
            )}
            {/* Desktop sidebar */}
            <AppSidebar className="hidden lg:flex" />
          </>
        )}
        <div className="flex-1 min-w-0 h-full overflow-auto flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
