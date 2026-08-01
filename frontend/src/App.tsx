import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { BookPage } from "./pages/BookPage";
import { BookingsPage } from "./pages/BookingsPage";
import { RoomsPage } from "./pages/RoomsPage";
import { RoomDetailPage } from "./pages/RoomDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";

export function App() {
  return (
    <>
      <header className="site-header">
        <div className="inner">
          <NavLink to="/" className="brand">
            Hyper<span>face</span> Rooms
          </NavLink>
          <nav className="nav">
            <NavLink to="/book">Book a room</NavLink>
            <NavLink to="/bookings">Bookings</NavLink>
            <NavLink to="/rooms">Rooms</NavLink>
            <NavLink to="/employees">Employees</NavLink>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        </Routes>
      </main>
    </>
  );
}
