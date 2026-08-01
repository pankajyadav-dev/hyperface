import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRooms, fetchEmployees, fetchBookings } from "../api";
import { todayISO } from "../time";
import type { BookingView, Employee, Room } from "../types";

export function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<BookingView[]>([]);

  useEffect(() => {
    Promise.all([fetchRooms(), fetchEmployees(), fetchBookings()]).then(
      ([r, e, b]) => {
        setRooms(r);
        setEmployees(e);
        setBookings(b);
      },
    );
  }, []);

  const today = todayISO();
  const activeToday = bookings.filter(
    (b) => b.status === "booked" && b.booking_date === today,
  ).length;

  return (
    <>
      <h1>Meeting rooms, without the clashes</h1>
      <p className="subtitle">
        Book a room for a time slot, check availability, and cancel when plans
        change. The system blocks double bookings automatically.
      </p>

      <div className="grid-cards">
        <div className="mini-card">
          <div className="name">{rooms.length}</div>
          <div className="meta">Rooms available</div>
        </div>
        <div className="mini-card">
          <div className="name">{employees.length}</div>
          <div className="meta">Registered employees</div>
        </div>
        <div className="mini-card">
          <div className="name">{activeToday}</div>
          <div className="meta">Bookings today</div>
        </div>
      </div>

      <div className="card">
        <h2>Get started</h2>
        <p className="hint">Everything you need is a click away.</p>
        <div className="btn-group">
          <Link to="/book" className="btn">
            Book a room
          </Link>
          <Link to="/bookings" className="btn btn-secondary">
            View bookings
          </Link>
          <Link to="/rooms" className="btn btn-secondary">
            Manage rooms
          </Link>
          <Link to="/employees" className="btn btn-secondary">
            Register employee
          </Link>
        </div>
      </div>
    </>
  );
}
