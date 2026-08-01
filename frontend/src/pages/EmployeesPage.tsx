import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEmployees } from "../api";
import { EmployeeForm } from "../components/EmployeeForm";
import type { Employee } from "../types";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const load = useCallback(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1>Employees</h1>
      <p className="subtitle">Register employees so they can make bookings.</p>

      <div className="card">
        <h2>Register an employee</h2>
        <p className="hint">Email must be unique.</p>
        <EmployeeForm onCreated={load} />
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
                      <Link to={`/employees/${e.id}`}>View bookings →</Link>
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
