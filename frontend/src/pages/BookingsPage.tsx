import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchRooms, fetchEmployees, fetchBookings } from "../api";
import { BookingsTable } from "../components/BookingsTable";
import type { BookingView, Employee, Room } from "../types";

export function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomFilter = searchParams.get("room")
    ? Number(searchParams.get("room"))
    : null;
  const employeeFilter = searchParams.get("employee")
    ? Number(searchParams.get("employee"))
    : null;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<BookingView[]>([]);

  useEffect(() => {
    Promise.all([fetchRooms(), fetchEmployees()]).then(([r, e]) => {
      setRooms(r);
      setEmployees(e);
    });
  }, []);

  const load = useCallback(() => {
    fetchBookings({ room: roomFilter, employee: employeeFilter }).then(
      setBookings,
    );
  }, [roomFilter, employeeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const room = String(form.get("room") ?? "");
    const employee = String(form.get("employee") ?? "");
    if (room) next.set("room", room);
    if (employee) next.set("employee", employee);
    setSearchParams(next);
  }

  return (
    <>
      <h1>Bookings</h1>
      <p className="subtitle">
        Every booking across all rooms. Filter by room or employee, or cancel a
        booking to free the slot.
      </p>

      <div className="card">
        <form
          onSubmit={applyFilters}
          className="row"
          style={{ alignItems: "flex-end" }}
        >
          <div className="field">
            <label htmlFor="room">Filter by room</label>
            <select id="room" name="room" defaultValue={roomFilter ?? ""}>
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · Floor {r.floor}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="employee">Filter by employee</label>
            <select
              id="employee"
              name="employee"
              defaultValue={employeeFilter ?? ""}
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: "0 0 auto" }}>
            <button type="submit">Apply</button>
          </div>
          <div className="field" style={{ flex: "0 0 auto" }}>
            <Link to="/bookings" className="btn btn-secondary">
              Clear
            </Link>
          </div>
        </form>
        <p className="hint" style={{ marginTop: 4 }}>
          Note: pick one filter at a time — room takes priority if both are set.
        </p>
      </div>

      <div className="card">
        <h2>{bookings.length} booking(s)</h2>
        <BookingsTable bookings={bookings} onChanged={load} />
      </div>
    </>
  );
}
