import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoom, getRoomBookings } from "@/lib/queries";
import { BookingsTable } from "@/components/BookingsTable";

export const dynamic = "force-dynamic";

export default async function RoomBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isInteger(roomId)) notFound();

  const room = await getRoom(roomId);
  if (!room) notFound();

  const bookings = await getRoomBookings(roomId);
  const active = bookings.filter((b) => b.status === "booked");

  return (
    <>
      <h1>{room.name}</h1>
      <p className="subtitle">
        Floor {room.floor} · seats {room.capacity} · {active.length} active
        booking(s)
      </p>
      <p>
        <Link href="/rooms">← All rooms</Link> ·{" "}
        <Link href="/book">Book this room</Link>
      </p>

      <div className="card">
        <h2>Bookings for {room.name}</h2>
        <p className="hint">Most recent first. Cancelled bookings are kept for reference.</p>
        <BookingsTable bookings={bookings} showRoom={false} />
      </div>
    </>
  );
}
