import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  getRooms,
  getRoom,
  getEmployees,
  getEmployee,
  getRoomBookings,
  getEmployeeBookings,
  getAllBookings,
  getRoomDayBookings,
} from "./queries";
import { findConflicts, suggestSlots } from "./availability";
import { EMAIL_RE, parseAndValidateBooking } from "./validation";
import { hhmmToPgTime, isoToPgDate, todayISO } from "./time";

const app = express();
app.use(cors());
app.use(express.json());

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function isOverlapViolation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("bookings_no_overlap") || msg.includes("23P01");
}

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, today: todayISO() });
});

app.get(
  "/api/rooms",
  asyncHandler(async (_req, res) => {
    res.json(await getRooms());
  }),
);

app.post(
  "/api/rooms",
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const floorRaw = String(req.body?.floor ?? "").trim();
    const capacityRaw = String(req.body?.capacity ?? "").trim();

    if (!name)
      return res.status(400).json({ ok: false, error: "Room name is required." });

    const floor = Number(floorRaw);
    if (!floorRaw || !Number.isInteger(floor))
      return res
        .status(400)
        .json({ ok: false, error: "Floor must be a whole number." });

    const capacity = Number(capacityRaw);
    if (!capacityRaw || !Number.isInteger(capacity) || capacity < 1)
      return res.status(400).json({
        ok: false,
        error: "Capacity must be a whole number of at least 1.",
      });

    try {
      await prisma.room.create({ data: { name, floor, capacity } });
    } catch (e) {
      if (isUniqueViolation(e))
        return res.status(409).json({
          ok: false,
          error: `Floor ${floor} already has a room called "${name}".`,
        });
      throw e;
    }

    res.status(201).json({
      ok: true,
      message: `Added ${name} (Floor ${floor}, seats ${capacity}).`,
    });
  }),
);

app.get(
  "/api/rooms/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ error: "Invalid room id." });
    const room = await getRoom(id);
    if (!room) return res.status(404).json({ error: "Room not found." });
    res.json(room);
  }),
);

app.get(
  "/api/rooms/:id/bookings",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ error: "Invalid room id." });
    res.json(await getRoomBookings(id));
  }),
);

app.get(
  "/api/employees",
  asyncHandler(async (_req, res) => {
    res.json(await getEmployees());
  }),
);

app.post(
  "/api/employees",
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim();

    if (!name)
      return res.status(400).json({ ok: false, error: "Name is required." });
    if (!email)
      return res.status(400).json({ ok: false, error: "Email is required." });
    if (!EMAIL_RE.test(email))
      return res
        .status(400)
        .json({ ok: false, error: "That doesn't look like a valid email." });

    try {
      await prisma.employee.create({ data: { name, email } });
    } catch (e) {
      if (isUniqueViolation(e))
        return res.status(409).json({
          ok: false,
          error: "An employee with that email already exists.",
        });
      throw e;
    }

    res.status(201).json({ ok: true, message: `Registered ${name}.` });
  }),
);

app.get(
  "/api/employees/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ error: "Invalid employee id." });
    const employee = await getEmployee(id);
    if (!employee) return res.status(404).json({ error: "Employee not found." });
    res.json(employee);
  }),
);

app.get(
  "/api/employees/:id/bookings",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ error: "Invalid employee id." });
    res.json(await getEmployeeBookings(id));
  }),
);

app.get(
  "/api/bookings",
  asyncHandler(async (req, res) => {
    const roomFilter = req.query.room ? Number(req.query.room) : null;
    const employeeFilter = req.query.employee
      ? Number(req.query.employee)
      : null;

    if (roomFilter) return res.json(await getRoomBookings(roomFilter));
    if (employeeFilter)
      return res.json(await getEmployeeBookings(employeeFilter));
    res.json(await getAllBookings(300));
  }),
);

app.post(
  "/api/bookings/check",
  asyncHandler(async (req, res) => {
    const parsed = await parseAndValidateBooking(req.body ?? {});
    if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
    const d = parsed.data!;

    const dayBookings = await getRoomDayBookings(d.roomId, isoToPgDate(d.date));
    const conflicts = findConflicts(dayBookings, d.start, d.end);

    if (conflicts.length === 0)
      return res.json({
        ok: true,
        message: "That slot is free — you're good to book it.",
      });

    res.json({
      ok: false,
      error: "That room is already booked for part of this slot.",
      conflicts,
      suggestions: suggestSlots(dayBookings, d.start, d.end),
    });
  }),
);

app.post(
  "/api/bookings",
  asyncHandler(async (req, res) => {
    const parsed = await parseAndValidateBooking(req.body ?? {});
    if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
    const d = parsed.data!;

    const dayBookings = await getRoomDayBookings(d.roomId, isoToPgDate(d.date));
    const conflicts = findConflicts(dayBookings, d.start, d.end);
    if (conflicts.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "That room is already booked for part of this slot.",
        conflicts,
        suggestions: suggestSlots(dayBookings, d.start, d.end),
      });
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
      if (isOverlapViolation(e)) {
        const fresh = await getRoomDayBookings(d.roomId, isoToPgDate(d.date));
        return res.status(409).json({
          ok: false,
          error: "That slot was just taken by someone else.",
          conflicts: findConflicts(fresh, d.start, d.end),
          suggestions: suggestSlots(fresh, d.start, d.end),
        });
      }
      throw e;
    }

    res.status(201).json({
      ok: true,
      message: `Booked ${d.date} from ${d.start} to ${d.end}.`,
    });
  }),
);

app.post(
  "/api/bookings/:id/cancel",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "Missing booking id." });

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ ok: false, error: "That booking no longer exists." });
    if (existing.status === "cancelled")
      return res
        .status(409)
        .json({ ok: false, error: "That booking is already cancelled." });

    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled", cancelledAt: new Date() },
    });

    res.json({ ok: true, message: "Booking cancelled." });
  }),
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Something went wrong on the server." });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Hyperface Rooms API listening on http://localhost:${port}`);
});
