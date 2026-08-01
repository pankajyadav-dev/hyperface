import { useEffect, useState } from "react";
import { fetchRooms, fetchEmployees } from "../api";
import { todayISO } from "../time";
import { BookingForm } from "../components/BookingForm";
import type { Employee, Room } from "../types";

export function BookPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchRooms(), fetchEmployees()]).then(([r, e]) => {
      setRooms(r);
      setEmployees(e);
      setLoaded(true);
    });
  }, []);

  return (
    <>
      <h1>Book a room</h1>
      <p className="subtitle">
        Pick a room, date and time. Use “Check availability” to preview conflicts
        and suggested free slots before booking.
      </p>

      <div className="card">
        {loaded && (
          <BookingForm rooms={rooms} employees={employees} today={todayISO()} />
        )}
      </div>
    </>
  );
}
