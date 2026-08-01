import { getRoom, getEmployee } from "./queries";
import { isValidDate, isValidTime, toMinutes } from "./time";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedBooking = {
  roomId: number;
  employeeId: number;
  date: string;
  start: string;
  end: string;
  attendees: number;
  title: string | null;
};

type Body = Record<string, unknown>;

function str(v: unknown): string {
  return String(v ?? "").trim();
}

export async function parseAndValidateBooking(
  body: Body,
): Promise<{ data?: ParsedBooking; error?: string }> {
  const roomId = Number(body.roomId);
  const employeeId = Number(body.employeeId);
  const date = str(body.date);
  const start = str(body.start);
  const end = str(body.end);
  const attendees = Number(body.attendees);
  const title = str(body.title) || null;

  if (!roomId) return { error: "Please choose a room." };
  if (!employeeId) return { error: "Please choose the employee making the booking." };
  if (!isValidDate(date)) return { error: "Please choose a valid date." };
  if (!isValidTime(start)) return { error: "Please enter a valid start time." };
  if (!isValidTime(end)) return { error: "Please enter a valid end time." };
  if (!Number.isInteger(attendees) || attendees < 1)
    return { error: "Number of attendees must be at least 1." };

  if (toMinutes(end) <= toMinutes(start))
    return { error: "End time must be after the start time." };

  const [room, employee] = await Promise.all([
    getRoom(roomId),
    getEmployee(employeeId),
  ]);
  if (!room) return { error: "That room no longer exists." };
  if (!employee) return { error: "That employee no longer exists." };

  if (attendees > room.capacity)
    return {
      error: `${room.name} seats ${room.capacity}, but you entered ${attendees} attendees.`,
    };

  return { data: { roomId, employeeId, date, start, end, attendees, title } };
}
