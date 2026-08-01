import type {
  ActionResult,
  BookingView,
  Employee,
  Room,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

async function postJSON(
  path: string,
  body: unknown,
): Promise<ActionResult> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return res.json() as Promise<ActionResult>;
}

export function fetchRooms(): Promise<Room[]> {
  return getJSON<Room[]>("/api/rooms");
}

export function fetchRoom(id: number): Promise<Room> {
  return getJSON<Room>(`/api/rooms/${id}`);
}

export function fetchRoomBookings(id: number): Promise<BookingView[]> {
  return getJSON<BookingView[]>(`/api/rooms/${id}/bookings`);
}

export function fetchEmployees(): Promise<Employee[]> {
  return getJSON<Employee[]>("/api/employees");
}

export function fetchEmployee(id: number): Promise<Employee> {
  return getJSON<Employee>(`/api/employees/${id}`);
}

export function fetchEmployeeBookings(id: number): Promise<BookingView[]> {
  return getJSON<BookingView[]>(`/api/employees/${id}/bookings`);
}

export function fetchBookings(filter?: {
  room?: number | null;
  employee?: number | null;
}): Promise<BookingView[]> {
  const params = new URLSearchParams();
  if (filter?.room) params.set("room", String(filter.room));
  if (filter?.employee) params.set("employee", String(filter.employee));
  const qs = params.toString();
  return getJSON<BookingView[]>(`/api/bookings${qs ? `?${qs}` : ""}`);
}

export function registerRoom(body: {
  name: string;
  floor: string;
  capacity: string;
}): Promise<ActionResult> {
  return postJSON("/api/rooms", body);
}

export function registerEmployee(body: {
  name: string;
  email: string;
}): Promise<ActionResult> {
  return postJSON("/api/employees", body);
}

export type BookingInput = {
  roomId: string;
  employeeId: string;
  date: string;
  start: string;
  end: string;
  attendees: string;
  title: string;
};

export function checkAvailability(body: BookingInput): Promise<ActionResult> {
  return postJSON("/api/bookings/check", body);
}

export function createBooking(body: BookingInput): Promise<ActionResult> {
  return postJSON("/api/bookings", body);
}

export function cancelBooking(id: number): Promise<ActionResult> {
  return postJSON(`/api/bookings/${id}/cancel`, {});
}
