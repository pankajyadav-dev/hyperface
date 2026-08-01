import { getRooms, getEmployees } from "@/lib/queries";
import { todayISO } from "@/lib/time";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const [rooms, employees] = await Promise.all([getRooms(), getEmployees()]);

  return (
    <>
      <h1>Book a room</h1>
      <p className="subtitle">
        Pick a room, date and time. Use “Check availability” to preview conflicts
        and suggested free slots before booking.
      </p>

      <div className="card">
        <BookingForm rooms={rooms} employees={employees} today={todayISO()} />
      </div>
    </>
  );
}
