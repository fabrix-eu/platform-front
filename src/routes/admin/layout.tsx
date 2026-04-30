import { Link, Outlet, useLocation } from '@tanstack/react-router';

const navItems = [
  { key: 'organizations', label: 'Organizations', href: '/admin/organizations' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'communities', label: 'Communities', href: '/admin/communities' },
  { key: 'feedbacks', label: 'Feedbacks', href: '/admin/feedbacks' },
  { key: 'claims', label: 'Claim requests', href: '/admin/claims' },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex-shrink-0 flex flex-col min-h-[calc(100vh-56px)]">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            Admin
          </h2>
        </div>

        <nav className="p-2 flex-1">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.key}>
                  <Link
                    to={item.href}
                    className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to app */}
        <div className="p-2 border-t border-border bg-white sticky bottom-0">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to app
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
