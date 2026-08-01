import { useState } from "react";
import { Link } from "react-router-dom";
import { checkAvailability, createBooking, type BookingInput } from "../api";
import type { ActionResult, Employee, Room } from "../types";

type Props = {
  rooms: Room[];
  employees: Employee[];
  today: string;
};

export function BookingForm({ rooms, employees, today }: Props) {
  const [fields, setFields] = useState<BookingInput>({
    roomId: rooms[0] ? String(rooms[0].id) : "",
    employeeId: employees[0] ? String(employees[0].id) : "",
    date: today,
    start: "10:00",
    end: "11:00",
    attendees: "1",
    title: "",
  });
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);

  const set = (k: keyof BookingInput, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  async function run(action: (body: BookingInput) => Promise<ActionResult>) {
    setPending(true);
    try {
      const result = await action(fields);
      setState(result);
    } finally {
      setPending(false);
    }
  }

  const noRooms = rooms.length === 0;
  const noEmployees = employees.length === 0;

  return (
    <div>
      {noRooms && (
        <div className="alert alert-warn">
          No rooms yet. <Link to="/rooms">Add a room</Link> first.
        </div>
      )}
      {noEmployees && (
        <div className="alert alert-warn">
          No employees yet. <Link to="/employees">Register an employee</Link>{" "}
          first.
        </div>
      )}

      {state?.ok && state.message && (
        <div className="alert alert-ok">{state.message}</div>
      )}
      {state && !state.ok && state.error && (
        <div className="alert alert-err">{state.error}</div>
      )}

      {state?.conflicts && state.conflicts.length > 0 && (
        <div className="alert alert-warn">
          <strong>Clashes with:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {state.conflicts.map((c) => (
              <li key={c.id}>
                {c.start_time}–{c.end_time}
                {c.title ? ` · ${c.title}` : ""} ({c.employee_name})
              </li>
            ))}
          </ul>
        </div>
      )}

      {state?.suggestions && state.suggestions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            Suggested free slots (same length) — click to use:
          </div>
          <div className="chips">
            {state.suggestions.map((s, i) => (
              <button
                type="button"
                key={i}
                className="chip"
                onClick={() => {
                  set("start", s.start);
                  set("end", s.end);
                }}
              >
                {s.start} – {s.end}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(createBooking);
        }}
      >
        <div className="row">
          <div className="field">
            <label htmlFor="roomId">Room</label>
            <select
              id="roomId"
              value={fields.roomId}
              onChange={(e) => set("roomId", e.target.value)}
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · Floor {r.floor} · seats {r.capacity}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="employeeId">Booked by</label>
            <select
              id="employeeId"
              value={fields.employeeId}
              onChange={(e) => set("employeeId", e.target.value)}
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={fields.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="start">Start</label>
            <input
              id="start"
              type="time"
              value={fields.start}
              onChange={(e) => set("start", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="end">End</label>
            <input
              id="end"
              type="time"
              value={fields.end}
              onChange={(e) => set("end", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="attendees">Attendees</label>
            <input
              id="attendees"
              type="number"
              min="1"
              step="1"
              value={fields.attendees}
              onChange={(e) => set("attendees", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="title">Meeting title (optional)</label>
          <input
            id="title"
            value={fields.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Sprint planning"
          />
        </div>

        <div className="btn-group">
          <button type="submit" disabled={pending || noRooms || noEmployees}>
            {pending ? "Working…" : "Book room"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={pending || noRooms || noEmployees}
            onClick={() => run(checkAvailability)}
          >
            Check availability
          </button>
        </div>
      </form>
    </div>
  );
}
