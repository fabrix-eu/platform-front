import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { getAdminUsers, deleteAdminUser, type AdminUser } from '../../lib/admin';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  facilitator: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-800',
};

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => getAdminUsers({ page, per_page: 20, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const columns: Column<AdminUser>[] = [
    { key: 'name', label: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'email', label: 'Email', render: (row) => row.email },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs ${ROLE_COLORS[row.role] ?? 'bg-gray-100 text-gray-800'}`}>
          {row.role}
        </span>
      ),
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (row) =>
        row.verified ? (
          <span className="text-green-600 text-xs font-medium">Yes</span>
        ) : (
          <span className="text-gray-400 text-xs">No</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={() => {
            if (confirm(`Delete user "${row.name}"?`)) {
              deleteMutation.mutate(row.id);
            }
          }}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <div className="bg-white border border-border rounded-lg">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.total_pages ?? 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
