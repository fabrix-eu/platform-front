import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type Column } from '../../components/admin/DataTable';
import {
  getAdminOrganizationClaims,
  approveAdminOrganizationClaim,
  rejectAdminOrganizationClaim,
  type AdminOrganizationClaim,
} from '../../lib/admin';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export function AdminClaimsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'claims', page, status],
    queryFn: () => getAdminOrganizationClaims({ page, per_page: 20, status: status || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] });

  const approveMutation = useMutation({
    mutationFn: approveAdminOrganizationClaim,
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectAdminOrganizationClaim(id, reason),
    onSuccess: () => {
      setRejectingId(null);
      setRejectionReason('');
      invalidate();
    },
  });

  function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId || !rejectionReason.trim()) return;
    rejectMutation.mutate({ id: rejectingId, reason: rejectionReason.trim() });
  }

  const columns: Column<AdminOrganizationClaim>[] = [
    {
      key: 'organization',
      label: 'Organization',
      render: (row) => (
        <span className="font-medium">{row.organization.name}</span>
      ),
    },
    {
      key: 'claimant',
      label: 'Claimant',
      render: (row) => (
        <div>
          <div className="font-medium">{row.claimant.name}</div>
          <div className="text-xs text-gray-500">{row.claimant.email}</div>
        </div>
      ),
    },
    {
      key: 'justification',
      label: 'Justification',
      render: (row) => (
        <p className="text-gray-700 text-sm max-w-xs truncate" title={row.justification}>
          {row.justification}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {row.status}
        </span>
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
      render: (row) => {
        if (row.status !== 'pending') {
          if (row.status === 'rejected' && row.rejection_reason) {
            return (
              <span className="text-xs text-gray-500 italic" title={row.rejection_reason}>
                {row.rejection_reason.length > 30 ? row.rejection_reason.slice(0, 30) + '...' : row.rejection_reason}
              </span>
            );
          }
          return null;
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => approveMutation.mutate(row.id)}
              disabled={approveMutation.isPending}
              className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => { setRejectingId(row.id); setRejectionReason(''); }}
              className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Claim requests</h1>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All</option>
        </select>
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

      {/* Rejection reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleReject} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Reject claim</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
