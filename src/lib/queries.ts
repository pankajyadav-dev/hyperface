import { prisma } from "./prisma";
import { pgDateToISO, pgTimeToHHMM } from "./time";
import type { BookingView, Employee, Room } from "./types";

// ---------------------------------------------------------------------
//  Rooms & Employees
// ---------------------------------------------------------------------
export async function getRooms(): Promise<Room[]> {
  const rows = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: [{ floor: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    floor: r.floor,
    capacity: r.capacity,
    is_active: r.isActive,
  }));
}

export async function getRoom(id: number): Promise<Room | null> {
  const r = await prisma.room.findUnique({ where: { id } });
  return r
    ? { id: r.id, name: r.name, floor: r.floor, capacity: r.capacity, is_active: r.isActive }
    : null;
}

export async function getEmployees(): Promise<Employee[]> {
  const rows = await prisma.employee.findMany({ orderBy: { name: "asc" } });
  return rows.map((e) => ({ id: e.id, name: e.name, email: e.email }));
}

export async function getEmployee(id: number): Promise<Employee | null> {
  const e = await prisma.employee.findUnique({ where: { id } });
  return e ? { id: e.id, name: e.name, email: e.email } : null;
}

// ---------------------------------------------------------------------
//  Booking views (joined with room + employee)
// ---------------------------------------------------------------------
type BookingWithRels = Awaited<
  ReturnType<typeof prisma.booking.findFirst>
> & {
  room: { name: string; floor: number; capacity: number };
  employee: { name: string; email: string };
};

const WITH_RELS = {
  room: { select: { name: true, floor: true, capacity: true } },
  employee: { select: { name: true, email: true } },
} as const;

function toView(b: BookingWithRels): BookingView {
  return {
    id: b.id,
    room_id: b.roomId,
    employee_id: b.employeeId,
    booking_date: pgDateToISO(b.bookingDate),
    start_time: pgTimeToHHMM(b.startTime),
    end_time: pgTimeToHHMM(b.endTime),
    attendees: b.attendees,
    title: b.title,
    status: b.status,
    room_name: b.room.name,
    floor: b.room.floor,
    capacity: b.room.capacity,
    employee_name: b.employee.name,
    employee_email: b.employee.email,
  };
}

/** Booked reservations for a room on a given date, ordered by start. */
export async function getRoomDayBookings(
  roomId: number,
  isoDate: Date,
): Promise<BookingView[]> {
  const rows = await prisma.booking.findMany({
    where: { roomId, bookingDate: isoDate, status: "booked" },
    include: WITH_RELS,
    orderBy: { startTime: "asc" },
  });
  return rows.map((r) => toView(r as BookingWithRels));
}

export async function getRoomBookings(roomId: number): Promise<BookingView[]> {
  const rows = await prisma.booking.findMany({
    where: { roomId },
    include: WITH_RELS,
    orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
  });
  return rows.map((r) => toView(r as BookingWithRels));
}

export async function getEmployeeBookings(
  employeeId: number,
): Promise<BookingView[]> {
  const rows = await prisma.booking.findMany({
    where: { employeeId },
    include: WITH_RELS,
    orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
  });
  return rows.map((r) => toView(r as BookingWithRels));
}

export async function getAllBookings(limit = 100): Promise<BookingView[]> {
  const rows = await prisma.booking.findMany({
    include: WITH_RELS,
    orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
    take: limit,
  });
  return rows.map((r) => toView(r as BookingWithRels));
}
