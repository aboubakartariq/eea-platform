"use client";

import { useActionState } from "react";

type WithError = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/**
 * useActionState plus a key that changes after every failed submission.
 * React resets a form after its action runs, and <select> elements then fall back
 * to their first defaultValue. Putting `key={errorKey}` on the <form> remounts it,
 * so every field (selects included) shows what the person submitted.
 */
export function useFormAction<S extends WithError>(fn: (prev: S, formData: FormData) => Promise<S>) {
  const [res, action, pending] = useActionState(
    async (prev: { state: S; n: number }, formData: FormData) => {
      const state = await fn(prev.state, formData);
      return { state, n: prev.n + (state?.error || state?.fieldErrors ? 1 : 0) };
    },
    { state: undefined as S, n: 0 },
  );
  return [res.state, action, pending, res.n] as const;
}
