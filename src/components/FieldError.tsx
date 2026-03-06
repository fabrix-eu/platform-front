import { ApiError } from '../lib/api';
import type { UseMutationResult } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMutation = UseMutationResult<any, Error, any, any>;

export function FieldError({ mutation, field }: {
  mutation: AnyMutation;
  field: string;
}) {
  if (!(mutation.error instanceof ApiError)) return null;
  const errors = mutation.error.errors?.[field];
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

export function FormError({ mutation }: { mutation: AnyMutation }) {
  const error = mutation.error;
  if (!error) return null;

  if (error instanceof ApiError) {
    const base = error.errors?.base;
    const msg = base?.[0] || error.message;
    return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{msg}</p>;
  }

  return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error.message}</p>;
}
