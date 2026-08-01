"use client";

import { useActionState, useEffect, useRef } from "react";
import { registerEmployee, type FormState } from "@/app/actions";
import { Alert } from "./Alert";

const initial: FormState = { ok: false };

export function EmployeeForm() {
  const [state, action, pending] = useActionState(registerEmployee, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful registration.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action}>
      <Alert state={state} />
      <div className="row">
        <div className="field">
          <label htmlFor="emp-name">Full name</label>
          <input id="emp-name" name="name" placeholder="Aarav Sharma" required />
        </div>
        <div className="field">
          <label htmlFor="emp-email">Work email</label>
          <input
            id="emp-email"
            name="email"
            type="email"
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
