import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { getAdminCommunities, deleteAdminCommunity, type AdminCommunity } from '../../lib/admin';

export function AdminCommunitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'communities', page, search],
    queryFn: () => getAdminCommunities({ page, per_page: 20, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'communities'] }),
  });

  const columns: Column<AdminCommunity>[] = [
    { key: 'name', label: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'slug', label: 'Slug', render: (row) => <span className="text-gray-500">{row.slug}</span> },
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
            if (confirm(`Delete community "${row.name}"?`)) {
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
        <h1 className="text-lg font-semibold text-gray-900">Communities</h1>
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
