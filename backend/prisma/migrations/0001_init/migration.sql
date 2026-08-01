CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "booking_status" AS ENUM ('booked', 'cancelled');

CREATE TABLE "employees" (
    "id"         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name"       TEXT        NOT NULL,
    "email"      TEXT        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "employees_name_not_blank" CHECK (length(trim("name")) > 0)
);

CREATE UNIQUE INDEX "employees_email_lower_key" ON "employees" (lower("email"));

CREATE TABLE "rooms" (
    "id"         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name"       TEXT        NOT NULL,
    "floor"      INTEGER     NOT NULL,
    "capacity"   INTEGER     NOT NULL,
    "is_active"  BOOLEAN     NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "rooms_name_not_blank" CHECK (length(trim("name")) > 0),
    CONSTRAINT "rooms_capacity_positive" CHECK ("capacity" > 0)
);

CREATE UNIQUE INDEX "rooms_floor_name_key" ON "rooms" ("floor", lower("name"));

CREATE TABLE "bookings" (
    "id"           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "room_id"      INTEGER     NOT NULL REFERENCES "rooms"("id")     ON DELETE RESTRICT,
    "employee_id"  INTEGER     NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT,
    "booking_date" DATE        NOT NULL,
    "start_time"   TIME(0)     NOT NULL,
    "end_time"     TIME(0)     NOT NULL,
    "attendees"    INTEGER     NOT NULL,
    "title"        TEXT,
    "status"       "booking_status" NOT NULL DEFAULT 'booked',
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "cancelled_at" TIMESTAMPTZ,

    CONSTRAINT "bookings_attendees_positive" CHECK ("attendees" > 0),
    CONSTRAINT "bookings_time_order"         CHECK ("end_time" > "start_time"),

    "during" tsrange GENERATED ALWAYS AS (
        tsrange(("booking_date" + "start_time"), ("booking_date" + "end_time"), '[)')
    ) STORED,

    CONSTRAINT "bookings_no_overlap" EXCLUDE USING gist (
        "room_id" WITH =,
        "during"  WITH &&
    ) WHERE ("status" = 'booked')
);

CREATE INDEX "bookings_room_id_booking_date_idx" ON "bookings" ("room_id", "booking_date");
CREATE INDEX "bookings_employee_id_idx"          ON "bookings" ("employee_id");
CREATE INDEX "bookings_status_booking_date_idx"  ON "bookings" ("status", "booking_date");

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_employees BEFORE UPDATE ON "employees"
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_rooms BEFORE UPDATE ON "rooms"
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_bookings BEFORE UPDATE ON "bookings"
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
