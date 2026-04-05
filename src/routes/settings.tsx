import { useState, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '../lib/auth';
import { updateMe, deleteMe } from '../lib/me';
import { uploadFile } from '../lib/uploads';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { FieldError, FormError } from '../components/FieldError';
import { getInitials } from '../lib/utils';

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: getMe });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Link
          to="/notification-preferences"
          className="text-sm text-primary hover:underline"
        >
          Notification preferences
        </Link>
      </div>

      <div className="space-y-10">
        <ProfileSection user={user} queryClient={queryClient} />
        <EmailSection user={user} queryClient={queryClient} />
        <PasswordSection queryClient={queryClient} />
        <DangerZone navigate={navigate} queryClient={queryClient} />
      </div>
    </div>
  );
}

// ── Profile (name + avatar) ───────────────────────────────────

function ProfileSection({
  user,
  queryClient,
}: {
  user: { id: string; name: string; image_url: string | null };
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: { name: string }) => updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'User', user.id);
      await updateMe({ image_url: url });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch {
      // upload error — ignore silently
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    await updateMe({ image_url: null });
    queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image_url ?? undefined} alt={user.name} />
          <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Change avatar'}
          </button>
          {user.image_url && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-sm text-gray-500 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Name */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          mutation.mutate({ name: fd.get('name') as string });
        }}
        className="space-y-3"
      >
        <FormError mutation={mutation} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="name" />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save name'}
        </button>
        {mutation.isSuccess && (
          <span className="text-sm text-green-600 ml-2">Saved</span>
        )}
      </form>
    </section>
  );
}

// ── Email ─────────────────────────────────────────────────────

function EmailSection({
  user,
  queryClient,
}: {
  user: { email: string };
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const mutation = useMutation({
    mutationFn: (data: { email: string; current_password: string }) => updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Email</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          mutation.mutate({
            email: fd.get('email') as string,
            current_password: fd.get('current_password') as string,
          });
        }}
        className="space-y-3"
      >
        <FormError mutation={mutation} />
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="email" />
        </div>
        <div>
          <label htmlFor="email-current-password" className="block text-sm font-medium text-gray-700 mb-1">
            Current password
          </label>
          <input
            id="email-current-password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="current_password" />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Update email'}
        </button>
        {mutation.isSuccess && (
          <span className="text-sm text-green-600 ml-2">Saved</span>
        )}
      </form>
    </section>
  );
}

// ── Password ──────────────────────────────────────────────────

function PasswordSection({
  queryClient,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    mutationFn: (data: { current_password: string; password: string; password_confirmation: string }) =>
      updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      formRef.current?.reset();
    },
  });

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Change password</h2>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          mutation.mutate({
            current_password: fd.get('current_password') as string,
            password: fd.get('password') as string,
            password_confirmation: fd.get('password_confirmation') as string,
          });
        }}
        className="space-y-3"
      >
        <FormError mutation={mutation} />
        <div>
          <label htmlFor="pw-current" className="block text-sm font-medium text-gray-700 mb-1">
            Current password
          </label>
          <input
            id="pw-current"
            name="current_password"
            type="password"
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="current_password" />
        </div>
        <div>
          <label htmlFor="pw-new" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="pw-new"
            name="password"
            type="password"
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="password" />
        </div>
        <div>
          <label htmlFor="pw-confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <input
            id="pw-confirm"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="password_confirmation" />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Updating...' : 'Update password'}
        </button>
        {mutation.isSuccess && (
          <span className="text-sm text-green-600 ml-2">Password updated</span>
        )}
      </form>
    </section>
  );
}

// ── Danger zone ───────────────────────────────────────────────

function DangerZone({
  navigate,
  queryClient,
}: {
  navigate: ReturnType<typeof useNavigate>;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: deleteMe,
    onSuccess: async () => {
      await logout();
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });

  return (
    <section className="border border-red-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Danger zone</h2>
      <p className="text-sm text-gray-600 mb-4">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>
      <FormError mutation={mutation} />

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700"
        >
          Delete my account
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-red-600 font-medium">Are you sure?</span>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
