import { Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreference,
  NOTIFICATION_TYPE_LABELS,
  type NotificationPreference,
} from '../lib/me';

export function NotificationPreferencesPage() {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification_preferences'],
    queryFn: getNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: updateNotificationPreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_preferences'] });
    },
  });

  function toggle(
    pref: NotificationPreference,
    field: 'enabled' | 'in_app' | 'email',
  ) {
    if (pref.mandatory) return;
    mutation.mutate({
      notification_type: pref.notification_type,
      enabled: field === 'enabled' ? !pref.enabled : pref.enabled,
      in_app: field === 'in_app' ? !pref.in_app : pref.in_app,
      email: field === 'email' ? !pref.email : pref.email,
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/settings" className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Notification preferences</h1>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {prefs && prefs.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_64px_64px_64px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Notification</span>
            <span className="text-center">On</span>
            <span className="text-center">In-app</span>
            <span className="text-center">Email</span>
          </div>

          {/* Rows */}
          {prefs.map((pref) => (
            <div
              key={pref.notification_type}
              className="grid grid-cols-[1fr_64px_64px_64px] gap-2 px-4 py-3 border-b border-gray-100 last:border-b-0 items-center"
            >
              <span className="text-sm text-gray-700">
                {NOTIFICATION_TYPE_LABELS[pref.notification_type] ?? pref.notification_type}
                {pref.mandatory && (
                  <span className="ml-2 text-xs text-gray-400">(required)</span>
                )}
              </span>
              <ToggleCell
                checked={pref.enabled}
                disabled={pref.mandatory}
                onChange={() => toggle(pref, 'enabled')}
              />
              <ToggleCell
                checked={pref.in_app}
                disabled={pref.mandatory || !pref.enabled}
                onChange={() => toggle(pref, 'in_app')}
              />
              <ToggleCell
                checked={pref.email}
                disabled={pref.mandatory || !pref.enabled}
                onChange={() => toggle(pref, 'email')}
              />
            </div>
          ))}
        </div>
      )}

      {prefs && prefs.length === 0 && (
        <p className="text-sm text-gray-500">No notification preferences available.</p>
      )}
    </div>
  );
}

function ToggleCell({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`
          relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${checked ? 'bg-primary' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
            transform transition duration-200 ease-in-out
            ${checked ? 'translate-x-4' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}
