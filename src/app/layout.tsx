import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyperface Rooms",
  description: "Book meeting rooms across Hyperface floors — no more double bookings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="brand">
              Hyper<span>face</span> Rooms
            </Link>
            <nav className="nav">
              <Link href="/book">Book a room</Link>
              <Link href="/bookings">Bookings</Link>
              <Link href="/rooms">Rooms</Link>
              <Link href="/employees">Employees</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
