import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee, getEmployeeBookings } from "@/lib/queries";
import { BookingsTable } from "@/components/BookingsTable";

export const dynamic = "force-dynamic";

export default async function EmployeeBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId)) notFound();

  const employee = await getEmployee(employeeId);
  if (!employee) notFound();

  const bookings = await getEmployeeBookings(employeeId);
  const active = bookings.filter((b) => b.status === "booked");

  return (
    <>
      <h1>{employee.name}</h1>
      <p className="subtitle">
        {employee.email} · {active.length} active booking(s)
      </p>
      <p>
        <Link href="/employees">← All employees</Link>
      </p>

      <div className="card">
        <h2>Bookings by {employee.name}</h2>
        <BookingsTable bookings={bookings} showEmployee={false} />
      </div>
    </>
  );
}
