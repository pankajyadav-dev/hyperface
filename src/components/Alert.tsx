import type { FormState } from "@/app/actions";

/** Renders the ok/error banner from a FormState. */
export function Alert({ state }: { state: FormState | null }) {
  if (!state) return null;
  if (state.ok && state.message)
    return <div className="alert alert-ok">{state.message}</div>;
  if (!state.ok && state.error)
    return <div className="alert alert-err">{state.error}</div>;
  return null;
}
