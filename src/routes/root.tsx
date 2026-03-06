import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { isAuthenticated, logout } from '../lib/auth';

export function RootLayout() {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-gray-900">
          mantel-thin
        </Link>
        {authed && (
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900"
              activeProps={{ className: 'text-sm text-gray-900 font-semibold' }}
            >
              Home
            </Link>
            <Link
              to="/organizations"
              className="text-sm text-gray-600 hover:text-gray-900"
              activeProps={{ className: 'text-sm text-gray-900 font-semibold' }}
            >
              Organizations
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
