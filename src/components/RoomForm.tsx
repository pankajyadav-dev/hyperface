"use client";

import { useActionState, useEffect, useRef } from "react";
import { registerRoom, type FormState } from "@/app/actions";
import { Alert } from "./Alert";

const initial: FormState = { ok: false };

export function RoomForm() {
  const [state, action, pending] = useActionState(registerRoom, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action}>
      <Alert state={state} />
      <div className="row">
        <div className="field">
          <label htmlFor="room-name">Room name</label>
          <input id="room-name" name="name" placeholder="Neptune" required />
        </div>
        <div className="field">
          <label htmlFor="room-floor">Floor</label>
          <input
            id="room-floor"
            name="floor"
            type="number"
            step="1"
            placeholder="3"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="room-capacity">Capacity</label>
          <input
            id="room-capacity"
            name="capacity"
            type="number"
            min="1"
            step="1"
            placeholder="6"
            required
          />
        </div>
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add room"}
      </button>
    </form>
  );
}
