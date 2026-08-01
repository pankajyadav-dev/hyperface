import { useState } from "react";
import { cancelBooking } from "../api";

export function CancelButton({
  bookingId,
  onDone,
}: {
  bookingId: number;
  onDone?: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancel this booking?")) return;
    setPending(true);
    try {
      await cancelBooking(bookingId);
      onDone?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="btn-danger"
      disabled={pending}
      onClick={handleCancel}
    >
      {pending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
