import Link from "next/link";
import { getEmployees } from "@/lib/queries";
import { EmployeeForm } from "@/components/EmployeeForm";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <>
      <h1>Employees</h1>
      <p className="subtitle">Register employees so they can make bookings.</p>

      <div className="card">
        <h2>Register an employee</h2>
        <p className="hint">Email must be unique.</p>
        <EmployeeForm />
      </div>

      <div className="card">
        <h2>All employees ({employees.length})</h2>
        {employees.length === 0 ? (
          <p className="empty">No employees registered yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.email}</td>
                    <td>
                      <Link href={`/employees/${e.id}`}>View bookings →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
