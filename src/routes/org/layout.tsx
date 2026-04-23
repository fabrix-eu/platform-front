import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from '../../components/AppSidebar';

export function OrgLayout() {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <AppSidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
