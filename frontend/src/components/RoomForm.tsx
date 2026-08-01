import { useState } from "react";
import { registerRoom } from "../api";
import type { ActionResult } from "../types";
import { Alert } from "./Alert";

export function RoomForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [capacity, setCapacity] = useState("");
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await registerRoom({ name, floor, capacity });
      setState(result);
      if (result.ok) {
        setName("");
        setFloor("");
        setCapacity("");
        onCreated?.();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Alert state={state} />
      <div className="row">
        <div className="field">
          <label htmlFor="room-name">Room name</label>
          <input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Neptune"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="room-floor">Floor</label>
          <input
            id="room-floor"
            type="number"
            step="1"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="3"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="room-capacity">Capacity</label>
          <input
            id="room-capacity"
            type="number"
            min="1"
            step="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
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
