import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRoom, fetchRoomBookings } from "../api";
import { BookingsTable } from "../components/BookingsTable";
import type { BookingView, Room } from "../types";

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id);

  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [notFound, setNotFound] = useState(false);

  const loadBookings = useCallback(() => {
    if (!Number.isInteger(roomId)) return;
    fetchRoomBookings(roomId).then(setBookings);
  }, [roomId]);

  useEffect(() => {
    if (!Number.isInteger(roomId)) {
      setNotFound(true);
      return;
    }
    fetchRoom(roomId)
      .then(setRoom)
      .catch(() => setNotFound(true));
    loadBookings();
  }, [roomId, loadBookings]);

  if (notFound) return <h1>Room not found</h1>;
  if (!room) return <p className="empty">Loading…</p>;

  const active = bookings.filter((b) => b.status === "booked");

  return (
    <>
      <h1>{room.name}</h1>
      <p className="subtitle">
        Floor {room.floor} · seats {room.capacity} · {active.length} active
        booking(s)
      </p>
      <p>
        <Link to="/rooms">← All rooms</Link> · <Link to="/book">Book this room</Link>
      </p>

      <div className="card">
        <h2>Bookings for {room.name}</h2>
        <p className="hint">
          Most recent first. Cancelled bookings are kept for reference.
        </p>
        <BookingsTable
          bookings={bookings}
          showRoom={false}
          onChanged={loadBookings}
        />
      </div>
    </>
  );
}
