import { useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';

export interface NavLeaf {
  to: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
  badge?: string | number | null;
  badgeVariant?: 'default' | 'highlight';
  unreadDot?: boolean;
}

export interface NavGroup {
  label: string;
  icon?: React.ReactNode;
  children: NavLeaf[];
  unreadDot?: boolean;
}

export interface NavSeparator {
  separator: true;
  /** Optional muted section label shown under the divider */
  label?: string;
}

export type NavItem = NavLeaf | NavGroup | NavSeparator;

const isGroup = (item: NavItem): item is NavGroup => 'children' in item;
const isSeparator = (item: NavItem): item is NavSeparator => 'separator' in item;

function isActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname.startsWith(to);
}

function LeafLink({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const active = isActive(pathname, item.to, item.exact);
  return (
    <Link
      to={item.to}
      className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className="flex items-center gap-2">
        {item.icon && <span className="shrink-0 text-gray-500">{item.icon}</span>}
        {item.label}
        {item.unreadDot && !active && (
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
      </span>
      {item.badge != null && (
        <span
          className={
            item.badgeVariant === 'highlight'
              ? 'text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium tabular-nums'
              : 'text-[11px] tabular-nums text-gray-400 font-normal'
          }
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function Group({
  group,
  pathname,
  expanded,
  onToggle,
}: {
  group: NavGroup;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasActiveChild = group.children.some((c) => isActive(pathname, c.to, c.exact));
  const hasUnread = group.unreadDot || group.children.some((c) => c.unreadDot);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        {group.icon && <span className="shrink-0">{group.icon}</span>}
        <span className="flex-1 min-w-0 text-left flex items-center gap-2">
          <span className="truncate">{group.label}</span>
          {hasUnread && !hasActiveChild && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
      {expanded && (
        <ul className="ml-[1.4rem] mt-0.5 space-y-0.5 border-l border-border pl-3">
          {group.children.map((child) => (
            <li key={child.to}>
              <LeafLink item={child} pathname={pathname} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();

  // The group that holds the current route — the one that should be open on load.
  const routeActiveKey =
    items.find(
      (it): it is NavGroup =>
        !isSeparator(it) && isGroup(it) && it.children.some((c) => isActive(pathname, c.to, c.exact)),
    )?.label ?? null;

  // Headers expand independently — several can be open while browsing.
  const [openKeys, setOpenKeys] = useState<Set<string>>(() =>
    routeActiveKey ? new Set([routeActiveKey]) : new Set(),
  );

  // Selecting a subitem (any navigation) collapses everything but the active group.
  useEffect(() => {
    setOpenKeys(routeActiveKey ? new Set([routeActiveKey]) : new Set());
  }, [pathname, routeActiveKey]);

  const toggle = (label: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <ul className="space-y-0.5">
      {items.map((item, i) =>
        isSeparator(item) ? (
          <li key={`sep-${i}`} className="pt-2 mt-2 border-t border-border" aria-hidden>
            {item.label && (
              <p className="px-3 pb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider truncate">
                {item.label}
              </p>
            )}
          </li>
        ) : (
          <li key={isGroup(item) ? item.label : item.to}>
            {isGroup(item) ? (
              <Group
                group={item}
                pathname={pathname}
                expanded={openKeys.has(item.label)}
                onToggle={() => toggle(item.label)}
              />
            ) : (
              <LeafLink item={item} pathname={pathname} />
            )}
          </li>
        ),
      )}
    </ul>
  );
}
