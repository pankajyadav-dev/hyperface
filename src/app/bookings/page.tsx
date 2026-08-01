import {
  getAllBookings,
  getRooms,
  getEmployees,
  getRoomBookings,
  getEmployeeBookings,
} from "@/lib/queries";
import { BookingsTable } from "@/components/BookingsTable";

export const dynamic = "force-dynamic";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; employee?: string }>;
}) {
  const sp = await searchParams;
  const roomFilter = sp.room ? Number(sp.room) : null;
  const employeeFilter = sp.employee ? Number(sp.employee) : null;

  const [rooms, employees] = await Promise.all([getRooms(), getEmployees()]);

  let bookings;
  if (roomFilter) bookings = await getRoomBookings(roomFilter);
  else if (employeeFilter) bookings = await getEmployeeBookings(employeeFilter);
  else bookings = await getAllBookings(300);

  return (
    <>
      <h1>Bookings</h1>
      <p className="subtitle">
        Every booking across all rooms. Filter by room or employee, or cancel a
        booking to free the slot.
      </p>

      <div className="card">
        {/* GET form so filters live in the URL and are shareable */}
        <form method="get" className="row" style={{ alignItems: "flex-end" }}>
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
            <a href="/bookings" className="btn btn-secondary">
              Clear
            </a>
          </div>
        </form>
        <p className="hint" style={{ marginTop: 4 }}>
          Note: pick one filter at a time — room takes priority if both are set.
        </p>
      </div>

      <div className="card">
        <h2>{bookings.length} booking(s)</h2>
        <BookingsTable bookings={bookings} />
      </div>
    </>
  );
}
