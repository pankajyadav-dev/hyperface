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
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  attendees: number;
  title: string | null;
  status: BookingStatus;
};

/** Booking joined with room + employee for display. */
export type BookingView = Booking & {
  room_name: string;
  floor: number;
  capacity: number;
  employee_name: string;
  employee_email: string;
};
