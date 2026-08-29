import {
  Home,
  ShoppingBag,
  Calendar,
  Map,
  Building2,
  Compass,
  Network,
  Users,
  MessageSquare,
  Bell,
  Settings,
  LayoutDashboard,
  FolderKanban,
  GraduationCap,
} from 'lucide-react';
import { useNavigationContext } from '../lib/useNavigationContext';
import { SidebarNav, type NavItem } from './SidebarNav';

export function AppSidebar({ className = '' }: { className?: string }) {
  const { user, currentOrg } = useNavigationContext();

  if (!user) return null;

  const orgSlug = currentOrg?.organization_slug;

  // Flat, single-level navigation: global features first, then the
  // current organization's, then personal entries.
  const items: NavItem[] = [
    // '/' redirects org members to their dashboard — link there directly so
    // the entry shows as active.
    {
      to: orgSlug ? `/${orgSlug}/dashboard` : '/',
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
      exact: !orgSlug,
    },
    { to: '/marketplace', label: 'Marketplace', icon: <ShoppingBag className="h-4 w-4" /> },
    { to: '/events', label: 'Events', icon: <Calendar className="h-4 w-4" /> },
    { to: '/global', label: 'Directory', icon: <Map className="h-4 w-4" /> },
  ];

  // Facilitator dashboard (CRM) — for facilitators and network members
  if ((user.networks?.length ?? 0) > 0 || user.role === 'facilitator') {
    items.push(
      { separator: true, label: 'Facilitator dashboard' },
      { to: '/facilitator', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
      { to: '/facilitator/network', label: 'My Network', icon: <FolderKanban className="h-4 w-4" /> },
    );
  }

  if (orgSlug) {
    items.push(
      { separator: true, label: currentOrg?.organization_name },
      { to: `/${orgSlug}/profile`, label: 'Profile', icon: <Building2 className="h-4 w-4" /> },
      { to: `/${orgSlug}/assessments`, label: 'Compass', icon: <Compass className="h-4 w-4" /> },
      { to: `/${orgSlug}/relations`, label: 'Connections', icon: <Network className="h-4 w-4" /> },
      // Members carries the invite-a-partner flow — the primary referral loop
      { to: `/${orgSlug}/settings/members`, label: 'Members', icon: <Users className="h-4 w-4" /> },
      { to: `/${orgSlug}/messages`, label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
    );
  } else {
    items.push({ to: '/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> });
  }

  items.push(
    { separator: true, label: 'Resources' },
    {
      to: 'https://learn.fabrixproject.eu',
      label: 'Learning Hub',
      icon: <GraduationCap className="h-4 w-4" />,
      external: true,
    },
    { separator: true },
    { to: '/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  );

  return (
    <aside className={`w-64 border-r border-border bg-white flex-shrink-0 overflow-y-auto flex flex-col ${className}`}>
      <nav className="p-2">
        <SidebarNav items={items} />
      </nav>
    </aside>
  );
}
