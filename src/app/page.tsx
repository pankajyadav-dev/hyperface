import Link from "next/link";
import { getRooms, getEmployees, getAllBookings } from "@/lib/queries";
import { todayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rooms, employees, bookings] = await Promise.all([
    getRooms(),
    getEmployees(),
    getAllBookings(500),
  ]);

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
          <Link href="/book" className="btn">
            Book a room
          </Link>
          <Link href="/bookings" className="btn btn-secondary">
            View bookings
          </Link>
          <Link href="/rooms" className="btn btn-secondary">
            Manage rooms
          </Link>
          <Link href="/employees" className="btn btn-secondary">
            Register employee
          </Link>
        </div>
      </div>
    </>
  );
}
