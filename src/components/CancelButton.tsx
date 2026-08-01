"use client";

import { useActionState } from "react";
import { cancelBooking, type FormState } from "@/app/actions";

const initial: FormState = { ok: false };

export function CancelButton({ bookingId }: { bookingId: number }) {
  const [, action, pending] = useActionState(cancelBooking, initial);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Cancel this booking?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <button type="submit" className="btn-danger" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel"}
      </button>
    </form>
  );
}
