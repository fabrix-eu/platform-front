import { useQuery } from '@tanstack/react-query';
import { getMe } from '../lib/auth';

export function HomePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  if (me.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (me.error) {
    return <div className="p-6 text-red-600">Failed to load user</div>;
  }

  const user = me.data!;

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome, {user.first_name} {user.last_name}
      </h1>
      <p className="text-gray-500 mb-1">{user.email}</p>
      <p className="text-sm text-gray-400">Role: {user.role}</p>
    </div>
  );
}
