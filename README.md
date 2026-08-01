# Hyperface Meeting Rooms

An internal tool for Hyperface Technologies to book meeting rooms across floors
without double bookings. Employees register, rooms are defined per floor, and
bookings are made for a date + time slot. The system **prevents overlapping
bookings**, enforces **room capacity**, supports **cancellation**, and offers an
**availability check with suggested free slots**.

Built as **two separate apps**:

- **`frontend/`** — a **React** single-page app (Vite + React Router).
- **`backend/`** — an **Express** REST API using **Prisma ORM** on **PostgreSQL**.

---

## Quick start (Docker — recommended)

```bash
docker compose up --build
```

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:4000**

The backend container automatically waits for Postgres, runs
`prisma migrate deploy` (creates the schema), seeds a few sample
rooms/employees (only if the DB is empty), then starts the API.

## Local dev (without Docker)

Requires Node.js and a running Postgres.

**Backend**

```bash
cd backend
npm install
cp .env.example .env          # edit DATABASE_URL if needed
npm run db:deploy             # create schema
npm run db:seed               # optional sample data
npm run dev                   # http://localhost:4000
```

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL defaults to http://localhost:4000
npm run dev                   # http://localhost:5173
```

---

## Pages

| Route                | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `/`                  | Dashboard with counts and shortcuts                                 |
| `/book`              | Make a booking; **Check availability** shows conflicts + suggestions |
| `/bookings`          | All bookings; filter by room/employee; **cancel** a booking         |
| `/rooms`             | Register rooms; list grouped by floor                               |
| `/rooms/:id`         | Bookings for one room                                                |
| `/employees`         | Register employees; list                                            |
| `/employees/:id`     | Bookings by one employee                                            |

## API

| Method | Endpoint                       | Purpose                              |
| ------ | ------------------------------ | ------------------------------------ |
| GET    | `/api/rooms`                   | List active rooms                    |
| POST   | `/api/rooms`                   | Register a room                      |
| GET    | `/api/rooms/:id`               | One room                             |
| GET    | `/api/rooms/:id/bookings`      | Bookings for a room                  |
| GET    | `/api/employees`               | List employees                      |
| POST   | `/api/employees`               | Register an employee                 |
| GET    | `/api/employees/:id`           | One employee                         |
| GET    | `/api/employees/:id/bookings`  | Bookings by an employee              |
| GET    | `/api/bookings?room=&employee=`| List/filter bookings                 |
| POST   | `/api/bookings/check`          | Availability check (no write)        |
| POST   | `/api/bookings`                | Create a booking                     |
| POST   | `/api/bookings/:id/cancel`     | Cancel a booking                     |

---

## Data model (entities & relationships)

```
employees 1───∞ bookings ∞───1 rooms
```

**employees** — `id`, `name`, `email` (unique, case-insensitive), timestamps.

**rooms** — `id`, `name`, `floor`, `capacity`, `is_active` (soft-disable),
timestamps. Room name is unique **per floor**.

**bookings** — `id`, `room_id → rooms`, `employee_id → employees`,
`booking_date`, `start_time`, `end_time`, `attendees`, `title` (optional),
`status` (`booked` | `cancelled`), timestamps, `cancelled_at`.

### Integrity is enforced in the database, not just the app

The Prisma schema (`backend/prisma/schema.prisma`) defines the tables; the
hand-written migration (`backend/prisma/migrations/0001_init/migration.sql`)
adds guarantees Prisma can't express on its own:

- **No double-booking** — a generated `tsrange` column `during` plus a GiST
  **exclusion constraint** (`bookings_no_overlap`) makes it impossible for two
  `booked` rows in the same room to overlap in time, even under concurrent
  requests. Cancelled rows are excluded, so cancelling instantly frees the slot.
- **`end_time > start_time`**, **`capacity > 0`**, **`attendees > 0`** — CHECK
  constraints.
- **Case-insensitive uniqueness** on employee email and on (floor, room name).
- **`updated_at`** auto-maintained by a trigger.

The API also checks conflicts before inserting so it can show a friendly
message + suggestions; the DB constraint is the final safety net for races.

---

## Edge cases handled

**Booking** — start ≥ end rejected; attendees over capacity rejected with actual
numbers; attendees < 1 or non-integer rejected; invalid date/time rejected;
overlap (full, partial, envelope; touching-at-edge allowed via half-open
ranges) rejected with clashing bookings and same-length slot suggestions;
deleted room/employee rejected; concurrent same-slot race rejected by the DB
exclusion constraint with a fresh conflict shown to the loser.

**Cancellation** — nonexistent or already-cancelled booking gives a clear error;
cancelling frees the slot immediately.

**Registration** — duplicate employee email (case-insensitive) rejected;
duplicate room name on the same floor rejected (same name on another floor is
fine); blank name / invalid email / non-integer floor or capacity rejected.

**Availability** — suggestions computed within office hours (08:00–20:00), match
the requested duration, prefer a time at/after the requested start, and skip
gaps that are too small.

---

## Project structure

```
backend/
  prisma/
    schema.prisma                 models
    migrations/0001_init/…        tables + exclusion constraint + checks
    seed.ts                       idempotent sample data
  src/
    prisma.ts                     Prisma client singleton
    queries.ts                    reads/writes via Prisma
    availability.ts               conflict detection + slot suggestions
    time.ts                       HH:MM math + Prisma date/time conversions
    validation.ts                 booking input validation
    types.ts
    server.ts                     Express app + REST routes
  Dockerfile, docker-entrypoint.sh
frontend/
  src/
    api.ts                        typed fetch client for the backend
    types.ts
    time.ts
    App.tsx, main.tsx, styles.css
    pages/                        one component per route
    components/                   forms, tables, cancel button, alerts
  Dockerfile, nginx.conf, vite.config.ts, index.html
docker-compose.yml                db + backend + frontend
```

## Tech

React 19 · React Router 7 · Vite 6 · Express 4 · Prisma 6 · PostgreSQL 16
(alpine) · TypeScript.
