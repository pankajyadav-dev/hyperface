"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRoom, getEmployee, getRoomDayBookings } from "@/lib/queries";
import { findConflicts, suggestSlots, type Slot } from "@/lib/availability";
import {
  hhmmToPgTime,
  isoToPgDate,
  isValidDate,
  isValidTime,
  toMinutes,
} from "@/lib/time";
import type { BookingView } from "@/lib/types";

// A single result shape used by every form (works with useActionState).
export type FormState = {
  ok: boolean;
  error?: string;
  message?: string;
  conflicts?: BookingView[];
  suggestions?: Slot[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

// Exclusion-constraint (double-booking) violations surface as an "unknown"
// Prisma error carrying the Postgres text — detect by constraint name/code.
function isOverlapViolation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("bookings_no_overlap") || msg.includes("23P01");
}

// ---------------------------------------------------------------------
//  Register an employee
// ---------------------------------------------------------------------
export async function registerEmployee(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) return { ok: false, error: "Name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (!EMAIL_RE.test(email))
    return { ok: false, error: "That doesn't look like a valid email." };

  try {
    await prisma.employee.create({ data: { name, email } });
  } catch (e) {
    if (isUniqueViolation(e))
      return { ok: false, error: "An employee with that email already exists." };
    throw e;
  }

  revalidatePath("/employees");
  revalidatePath("/book");
  return { ok: true, message: `Registered ${name}.` };
}

// ---------------------------------------------------------------------
//  Register a room
// ---------------------------------------------------------------------
export async function registerRoom(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const floorRaw = String(formData.get("floor") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (!name) return { ok: false, error: "Room name is required." };

  const floor = Number(floorRaw);
  if (!floorRaw || !Number.isInteger(floor))
    return { ok: false, error: "Floor must be a whole number." };

  const capacity = Number(capacityRaw);
  if (!capacityRaw || !Number.isInteger(capacity) || capacity < 1)
    return { ok: false, error: "Capacity must be a whole number of at least 1." };

  try {
    await prisma.room.create({ data: { name, floor, capacity } });
  } catch (e) {
    if (isUniqueViolation(e))
      return {
        ok: false,
        error: `Floor ${floor} already has a room called "${name}".`,
      };
    throw e;
  }

  revalidatePath("/rooms");
  revalidatePath("/book");
  return { ok: true, message: `Added ${name} (Floor ${floor}, seats ${capacity}).` };
}

// ---------------------------------------------------------------------
//  Shared booking-input validation
// ---------------------------------------------------------------------
type ParsedBooking = {
  roomId: number;
  employeeId: number;
  date: string;
  start: string;
  end: string;
  attendees: number;
  title: string | null;
};

async function parseAndValidate(
  formData: FormData,
): Promise<{ data?: ParsedBooking; error?: string }> {
  const roomId = Number(formData.get("roomId"));
  const employeeId = Number(formData.get("employeeId"));
  const date = String(formData.get("date") ?? "").trim();
  const start = String(formData.get("start") ?? "").trim();
  const end = String(formData.get("end") ?? "").trim();
  const attendees = Number(formData.get("attendees"));
  const title = String(formData.get("title") ?? "").trim() || null;

  if (!roomId) return { error: "Please choose a room." };
  if (!employeeId) return { error: "Please choose the employee making the booking." };
  if (!isValidDate(date)) return { error: "Please choose a valid date." };
  if (!isValidTime(start)) return { error: "Please enter a valid start time." };
  if (!isValidTime(end)) return { error: "Please enter a valid end time." };
  if (!Number.isInteger(attendees) || attendees < 1)
    return { error: "Number of attendees must be at least 1." };

  if (toMinutes(end) <= toMinutes(start))
    return { error: "End time must be after the start time." };

  // The room and employee must actually exist.
  const [room, employee] = await Promise.all([
    getRoom(roomId),
    getEmployee(employeeId),
  ]);
  if (!room) return { error: "That room no longer exists." };
  if (!employee) return { error: "That employee no longer exists." };

  // Capacity match.
  if (attendees > room.capacity)
    return {
      error: `${room.name} seats ${room.capacity}, but you entered ${attendees} attendees.`,
    };

  return { data: { roomId, employeeId, date, start, end, attendees, title } };
}

// ---------------------------------------------------------------------
//  Availability check (no write) — used by the "Check" button
// ---------------------------------------------------------------------
export async function checkAvailability(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = await parseAndValidate(formData);
  if (parsed.error) return { ok: false, error: parsed.error };
  const d = parsed.data!;

  const dayBookings = await getRoomDayBookings(d.roomId, isoToPgDate(d.date));
  const conflicts = findConflicts(dayBookings, d.start, d.end);

  if (conflicts.length === 0)
    return { ok: true, message: "That slot is free — you're good to book it." };

  return {
    ok: false,
    error: "That room is already booked for part of this slot.",
    conflicts,
    suggestions: suggestSlots(dayBookings, d.start, d.end),
  };
}

// ---------------------------------------------------------------------
//  Create a booking
// ---------------------------------------------------------------------
export async function createBooking(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = await parseAndValidate(formData);
  if (parsed.error) return { ok: false, error: parsed.error };
  const d = parsed.data!;

  // Friendly pre-check so we can show conflicts + suggestions. The DB
  // exclusion constraint below is the real guarantee against races.
  const dayBookings = await getRoomDayBookings(d.roomId, isoToPgDate(d.date));
  const conflicts = findConflicts(dayBookings, d.start, d.end);
  if (conflicts.length > 0) {
    return {
      ok: false,
      error: "That room is already booked for part of this slot.",
      conflicts,
      suggestions: suggestSlots(dayBookings, d.start, d.end),
    };
  }

  try {
    await prisma.booking.create({
      data: {
        roomId: d.roomId,
        employeeId: d.employeeId,
        bookingDate: isoToPgDate(d.date),
        startTime: hhmmToPgTime(d.start),
        endTime: hhmmToPgTime(d.end),
        attendees: d.attendees,
        title: d.title,
      },
    });
  } catch (e) {
    // Someone grabbed the slot between our check and insert.
    if (isOverlapViolation(e)) {
      const fresh = await getRoomDayBookings(d.roomId, isoToPgDate(d.date));
      return {
        ok: false,
        error: "That slot was just taken by someone else.",
        conflicts: findConflicts(fresh, d.start, d.end),
        suggestions: suggestSlots(fresh, d.start, d.end),
      };
    }
    throw e;
  }

  revalidatePath("/bookings");
  revalidatePath("/rooms");
  return {
    ok: true,
    message: `Booked ${d.date} from ${d.start} to ${d.end}.`,
  };
}

// ---------------------------------------------------------------------
//  Cancel a booking
// ---------------------------------------------------------------------
export async function cancelBooking(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = Number(formData.get("bookingId"));
  if (!id) return { ok: false, error: "Missing booking id." };

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "That booking no longer exists." };
  if (existing.status === "cancelled")
    return { ok: false, error: "That booking is already cancelled." };

  await prisma.booking.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  revalidatePath("/bookings");
  revalidatePath("/rooms");
  return { ok: true, message: "Booking cancelled." };
}
