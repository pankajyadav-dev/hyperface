import { useState } from "react";
import { registerEmployee } from "../api";
import type { ActionResult } from "../types";
import { Alert } from "./Alert";

export function EmployeeForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await registerEmployee({ name, email });
      setState(result);
      if (result.ok) {
        setName("");
        setEmail("");
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
          <label htmlFor="emp-name">Full name</label>
          <input
            id="emp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Sharma"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="emp-email">Work email</label>
          <input
            id="emp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aarav@hyperface.io"
            required
          />
        </div>
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Registering…" : "Register employee"}
      </button>
    </form>
  );
}
