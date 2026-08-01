import type { ActionResult } from "../types";

export function Alert({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok && state.message)
    return <div className="alert alert-ok">{state.message}</div>;
  if (!state.ok && state.error)
    return <div className="alert alert-err">{state.error}</div>;
  return null;
}
