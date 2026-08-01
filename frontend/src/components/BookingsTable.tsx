import type { BookingView } from "../types";
import { CancelButton } from "./CancelButton";

export function BookingsTable({
  bookings,
  showRoom = true,
  showEmployee = true,
  onChanged,
}: {
  bookings: BookingView[];
  showRoom?: boolean;
  showEmployee?: boolean;
  onChanged?: () => void;
}) {
  if (bookings.length === 0) {
    return <p className="empty">No bookings to show.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            {showRoom && <th>Room</th>}
            {showEmployee && <th>Booked by</th>}
            <th>Attendees</th>
            <th>Title</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.booking_date}</td>
              <td>
                {b.start_time}–{b.end_time}
              </td>
              {showRoom && (
                <td>
                  {b.room_name}
                  <span style={{ color: "var(--muted)" }}> · Fl {b.floor}</span>
                </td>
              )}
              {showEmployee && <td>{b.employee_name}</td>}
              <td>{b.attendees}</td>
              <td>{b.title ?? "—"}</td>
              <td>
                <span className={`badge badge-${b.status}`}>{b.status}</span>
              </td>
              <td>
                {b.status === "booked" && (
                  <CancelButton bookingId={b.id} onDone={onChanged} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
