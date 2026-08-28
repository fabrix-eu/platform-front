import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNetwork } from '../../lib/networks';

/** Shown to a facilitator who has no network yet. */
export function CreateNetworkForm() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: { name: string; description?: string; center_address?: string }) =>
      createNetwork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white rounded-lg border border-border p-8">
      <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Create your network</h1>
      <p className="text-sm text-gray-500 mb-6">
        Your network is your CRM: the organizations you follow, their needs, your contact
        history and your team's tasks.
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          create.mutate({
            name: (fd.get('name') as string).trim(),
            description: (fd.get('description') as string) || undefined,
            center_address: (fd.get('center_address') as string) || undefined,
          });
        }}
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Lille Circular Textile"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div>
          <label htmlFor="center_address" className="block text-sm font-medium text-gray-700 mb-1">
            Territory (city or address)
          </label>
          <input
            id="center_address"
            name="center_address"
            placeholder="e.g. Lille, France"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {create.isError && (
          <p className="text-sm text-red-600">Could not create the network. Check the name and try again.</p>
        )}
        <button
          type="submit"
          disabled={create.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {create.isPending ? 'Creating...' : 'Create network'}
        </button>
      </form>
    </div>
  );
}
