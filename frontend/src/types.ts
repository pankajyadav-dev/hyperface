export type Room = {
  id: number;
  name: string;
  floor: number;
  capacity: number;
  is_active: boolean;
};

export type Employee = {
  id: number;
  name: string;
  email: string;
};

export type BookingStatus = "booked" | "cancelled";

export type Booking = {
  id: number;
  room_id: number;
  employee_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  attendees: number;
  title: string | null;
  status: BookingStatus;
};

export type BookingView = Booking & {
  room_name: string;
  floor: number;
  capacity: number;
  employee_name: string;
  employee_email: string;
};

export type Slot = { start: string; end: string };

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  conflicts?: BookingView[];
  suggestions?: Slot[];
};
