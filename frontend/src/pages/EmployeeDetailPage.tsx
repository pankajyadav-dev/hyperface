import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchEmployee, fetchEmployeeBookings } from "../api";
import { BookingsTable } from "../components/BookingsTable";
import type { BookingView, Employee } from "../types";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [notFound, setNotFound] = useState(false);

  const loadBookings = useCallback(() => {
    if (!Number.isInteger(employeeId)) return;
    fetchEmployeeBookings(employeeId).then(setBookings);
  }, [employeeId]);

  useEffect(() => {
    if (!Number.isInteger(employeeId)) {
      setNotFound(true);
      return;
    }
    fetchEmployee(employeeId)
      .then(setEmployee)
      .catch(() => setNotFound(true));
    loadBookings();
  }, [employeeId, loadBookings]);

  if (notFound) return <h1>Employee not found</h1>;
  if (!employee) return <p className="empty">Loading…</p>;

  const active = bookings.filter((b) => b.status === "booked");

  return (
    <>
      <h1>{employee.name}</h1>
      <p className="subtitle">
        {employee.email} · {active.length} active booking(s)
      </p>
      <p>
        <Link to="/employees">← All employees</Link>
      </p>

      <div className="card">
        <h2>Bookings by {employee.name}</h2>
        <BookingsTable
          bookings={bookings}
          showEmployee={false}
          onChanged={loadBookings}
        />
      </div>
    </>
  );
}
