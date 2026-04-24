import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { getAdminFeedbacks, type AdminFeedback } from '../../lib/admin';
import { useCreateConversation } from '../../lib/conversations';

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-800',
  feature: 'bg-blue-100 text-blue-800',
  question: 'bg-amber-100 text-amber-800',
};

export function AdminFeedbacksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const createConversation = useCreateConversation();

  function handleReply(feedback: AdminFeedback) {
    const truncated = feedback.message.length > 100
      ? feedback.message.slice(0, 100) + '...'
      : feedback.message;
    const content = `About your feedback: "${truncated}"\n\n`;

    createConversation.mutate(
      { recipient_user_id: feedback.user.id, content },
      {
        onSuccess: (conversation) => {
          navigate({ to: '/messages', search: { selected: conversation.id } });
        },
      },
    );
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'feedbacks', page, search],
    queryFn: () => getAdminFeedbacks({ page, per_page: 20, search: search || undefined }),
  });

  const columns: Column<AdminFeedback>[] = [
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div>
          <div className="font-medium">{row.user.name}</div>
          <div className="text-xs text-gray-500">{row.user.email}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[row.category] ?? 'bg-gray-100 text-gray-800'}`}>
          {row.category}
        </span>
      ),
    },
    {
      key: 'message',
      label: 'Message',
      render: (row) => (
        <div className="max-w-md">
          <p className="text-gray-700 truncate">{row.message}</p>
          {row.message.length > 80 && (
            <button
              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              {expandedId === row.id ? 'Less' : 'More'}
            </button>
          )}
          {expandedId === row.id && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
              {row.message}
              {row.screenshot_url && (
                <a
                  href={row.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-xs text-primary hover:underline"
                >
                  View screenshot
                </a>
              )}
            </div>
          )}
        </div>
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
          onClick={() => handleReply(row)}
          disabled={createConversation.isPending}
          className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          Reply
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Feedbacks</h1>
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
