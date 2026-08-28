import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNetworkTasks,
  createNetworkTask,
  updateNetworkTask,
  deleteNetworkTask,
  getNetworkOrganizations,
  type NetworkTask,
} from '../../lib/networks';

function TaskRow({ task, networkSlug, onChanged }: { task: NetworkTask; networkSlug: string; onChanged: () => void }) {
  const toggle = useMutation({
    mutationFn: () => updateNetworkTask(networkSlug, task.id, { done: !task.done_at }),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => deleteNetworkTask(networkSlug, task.id),
    onSuccess: onChanged,
  });

  const overdue = !task.done_at && task.due_on && new Date(task.due_on) < new Date(new Date().toDateString());

  return (
    <li className="flex items-center gap-3 py-2 group">
      <input
        type="checkbox"
        checked={!!task.done_at}
        onChange={() => toggle.mutate()}
        disabled={toggle.isPending}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.done_at ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-2">
          {task.due_on && (
            <span className={overdue ? 'text-red-600 font-medium' : ''}>
              {new Date(task.due_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.organization && (
            <Link
              to="/facilitator/network/$norgId"
              params={{ norgId: task.network_organization_id! }}
              search={{ network: networkSlug }}
              className="truncate hover:text-primary"
            >
              {task.organization.name}
            </Link>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => remove.mutate()}
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs"
      >
        ✕
      </button>
    </li>
  );
}

export function TasksPanel({ networkSlug, networkOrgId }: { networkSlug: string; networkOrgId?: string }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'open' | 'done'>('open');

  const tasksQuery = useQuery({
    queryKey: ['network_tasks', networkSlug, tab, networkOrgId],
    queryFn: () =>
      getNetworkTasks(networkSlug, {
        open: tab === 'open' || undefined,
        done: tab === 'done' || undefined,
        network_organization_id: networkOrgId,
      }),
  });

  const orgsQuery = useQuery({
    queryKey: ['network_organizations', networkSlug, 'for-tasks'],
    queryFn: () => getNetworkOrganizations(networkSlug, { per_page: 200 }),
    enabled: !networkOrgId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['network_tasks', networkSlug] });
  };

  const create = useMutation({
    mutationFn: (data: { title: string; due_on?: string; network_organization_id?: string }) =>
      createNetworkTask(networkSlug, data),
    onSuccess: invalidate,
  });

  const tasks = tasksQuery.data?.data ?? [];

  return (
    <section className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks</h2>
        <div className="flex gap-1">
          {(['open', 'done'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t === 'open' ? 'To do' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      <form
        className="flex flex-wrap gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const title = (fd.get('title') as string).trim();
          if (!title) return;
          create.mutate({
            title,
            due_on: (fd.get('due_on') as string) || undefined,
            network_organization_id: networkOrgId || (fd.get('network_organization_id') as string) || undefined,
          });
          e.currentTarget.reset();
        }}
      >
        <input
          name="title"
          placeholder="Add a task..."
          className="flex-1 min-w-[160px] border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="due_on"
          type="date"
          className="border border-border rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {!networkOrgId && (
          <select
            name="network_organization_id"
            className="border border-border rounded-lg px-2 py-1.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-ring max-w-[180px]"
          >
            <option value="">No organization</option>
            {(orgsQuery.data?.data ?? []).map((no) => (
              <option key={no.id} value={no.id}>{no.organization.name}</option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={create.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {tasksQuery.isLoading ? (
        <p className="text-sm text-gray-400 py-4">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">{tab === 'open' ? 'Nothing to do — enjoy!' : 'No completed tasks yet.'}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} networkSlug={networkSlug} onChanged={invalidate} />
          ))}
        </ul>
      )}
    </section>
  );
}
