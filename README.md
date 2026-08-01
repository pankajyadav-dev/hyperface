# Hyperface Meeting Rooms

An internal tool for Hyperface Technologies to book meeting rooms across floors
without double bookings. Employees register, rooms are defined per floor, and
bookings are made for a date + time slot. The system **prevents overlapping
bookings**, enforces **room capacity**, supports **cancellation**, and offers an
**availability check with suggested free slots**.

Built as a single **Next.js 15 (App Router)** app, running on **Bun**, with
**Prisma ORM** on **PostgreSQL**. Ships with a `Dockerfile` and
`docker-compose.yml` (Postgres alpine).

---

## Quick start (Docker — recommended)

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

The app container automatically:

1. waits for Postgres,
2. runs `prisma migrate deploy` (creates the schema),
3. seeds a few sample rooms/employees (only if the DB is empty),
4. starts Next.js.

Sample data lets you try it immediately: rooms Neptune/Saturn/Mercury/Jupiter/Pluto
and three employees.

## Local dev (without Docker)

Requires Bun and a running Postgres.

```bash
bun install
cp .env.example .env          # edit DATABASE_URL if needed
bunx prisma migrate deploy    # create schema
bun prisma/seed.ts            # optional sample data
bun run dev                   # http://localhost:3000
```

---

## Pages

| Page                 | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `/`                  | Dashboard with counts and shortcuts                                 |
| `/book`              | Make a booking; **Check availability** shows conflicts + suggestions |
| `/bookings`          | All bookings; filter by room/employee; **cancel** a booking         |
| `/rooms`             | Register rooms; list grouped by floor                               |
| `/rooms/[id]`        | Bookings for one room                                                |
| `/employees`         | Register employees; list                                            |
| `/employees/[id]`    | Bookings by one employee                                             |

---

## Data model (entities & relationships)

Designed as it would sit in a real relational DB — surrogate keys, status
columns instead of hard deletes, timestamps, and foreign keys.

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

The Prisma schema (`prisma/schema.prisma`) defines the tables; the hand-written
migration (`prisma/migrations/0001_init/migration.sql`) adds guarantees Prisma
can't express on its own:

- **No double-booking** — a generated `tsrange` column `during` plus a GiST
  **exclusion constraint** (`bookings_no_overlap`) makes it *impossible* for two
  `booked` rows in the same room to overlap in time, even under concurrent
  requests. Cancelled rows are excluded, so cancelling instantly frees the slot.
- **`end_time > start_time`**, **`capacity > 0`**, **`attendees > 0`** — CHECK
  constraints.
- **Case-insensitive uniqueness** on employee email and on (floor, room name).
- **`updated_at`** auto-maintained by a trigger.

The app also checks conflicts *before* inserting so it can show a friendly
message + suggestions; the DB constraint is the final safety net for races.

### Why it's future-upgradeable without big rewrites

- Surrogate integer keys everywhere → relationships never break when labels change.
- `status` enum + `cancelled_at` → we never delete history; new statuses (e.g.
  `pending`, `checked_in`) are additive.
- `is_active` on rooms → decommission a room without losing its bookings.
- Real Prisma migrations (`schema_migrations` tracked) → the next change is just
  a new migration file; no manual DB surgery.
- Clean separation: `lib/queries.ts` (data), `lib/availability.ts` (rules),
  `app/actions.ts` (validation) — easy to extend (recurring bookings, approvals,
  auth) without touching the UI.

---

## Edge cases handled

**Booking**

- Start time equal to or after end time → rejected.
- Attendees exceed room capacity → rejected with the actual numbers.
- Attendees < 1 or non-integer → rejected.
- Invalid/malformed date or time → rejected.
- Overlapping an existing booking (full, partial, envelope, or touching-at-edge
  is allowed since ranges are half-open `[start, end)`) → rejected with the list
  of clashing bookings **and** suggested free slots of the same length.
- Room or employee deleted/nonexistent between page load and submit → rejected.
- Race: two people book the same slot simultaneously → DB exclusion constraint
  rejects the loser, who is shown the fresh conflict + suggestions.

**Cancellation**

- Cancelling a nonexistent booking → clear error.
- Cancelling an already-cancelled booking → clear error (idempotent-safe).
- Cancelling frees the slot immediately (constraint ignores cancelled rows).

**Registration**

- Duplicate employee email (case-insensitive) → rejected.
- Duplicate room name on the same floor → rejected (same name on another floor
  is fine).
- Blank name / invalid email / non-integer floor or capacity → rejected.

**Availability / suggestions**

- Suggestions are computed within office hours (08:00–20:00), match the
  requested duration, prefer a time at/after the requested start, and skip gaps
  that are too small.

---

## Project structure

```
prisma/
  schema.prisma                 # models
  migrations/0001_init/…        # tables + exclusion constraint + checks
  seed.ts                       # idempotent sample data
src/
  lib/
    prisma.ts                   # Prisma client singleton
    queries.ts                  # all reads/writes via Prisma
    availability.ts             # conflict detection + slot suggestions
    time.ts                     # HH:MM math + Prisma date/time conversions
    types.ts
  app/
    actions.ts                  # server actions (all validation lives here)
    page.tsx, book/, bookings/, rooms/, employees/
  components/                   # forms, tables, cancel button, alerts
Dockerfile, docker-compose.yml, docker-entrypoint.sh
```

## Tech

Next.js 15 · React 19 · Prisma 6 · PostgreSQL 16 (alpine) · Bun · TypeScript.
