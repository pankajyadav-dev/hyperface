import Link from "next/link";
import { getRooms } from "@/lib/queries";
import { RoomForm } from "@/components/RoomForm";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await getRooms();

  // Group rooms by floor for a tidy overview.
  const byFloor = new Map<number, typeof rooms>();
  for (const r of rooms) {
    const list = byFloor.get(r.floor) ?? [];
    list.push(r);
    byFloor.set(r.floor, list);
  }
  const floors = [...byFloor.keys()].sort((a, b) => a - b);

  return (
    <>
      <h1>Rooms</h1>
      <p className="subtitle">Register meeting rooms across floors.</p>

      <div className="card">
        <h2>Add a room</h2>
        <p className="hint">
          Room names must be unique per floor. Capacity is used to block
          over-booking a small room.
        </p>
        <RoomForm />
      </div>

      <div className="card">
        <h2>All rooms ({rooms.length})</h2>
        {rooms.length === 0 ? (
          <p className="empty">No rooms yet. Add your first one above.</p>
        ) : (
          floors.map((floor) => (
            <div key={floor} style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Floor {floor}
              </div>
              <div className="grid-cards">
                {byFloor.get(floor)!.map((r) => (
                  <div key={r.id} className="mini-card">
                    <div className="name">{r.name}</div>
                    <div className="meta">Seats {r.capacity}</div>
                    <div style={{ marginTop: 8 }}>
                      <Link href={`/rooms/${r.id}`}>View bookings →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
