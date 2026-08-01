import {
  OFFICE_END_MIN,
  OFFICE_START_MIN,
  overlaps,
  toHHMM,
  toMinutes,
} from "./time";
import type { BookingView } from "./types";

export type Slot = { start: string; end: string };

export function findConflicts(
  dayBookings: BookingView[],
  start: string,
  end: string,
): BookingView[] {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return dayBookings.filter((b) =>
    overlaps(s, e, toMinutes(b.start_time), toMinutes(b.end_time)),
  );
}

export function suggestSlots(
  dayBookings: BookingView[],
  start: string,
  end: string,
  max = 3,
): Slot[] {
  const duration = toMinutes(end) - toMinutes(start);
  if (duration <= 0) return [];

  const busy = dayBookings
    .map((b) => ({ s: toMinutes(b.start_time), e: toMinutes(b.end_time) }))
    .sort((a, b) => a.s - b.s);

  const merged: { s: number; e: number }[] = [];
  for (const iv of busy) {
    const last = merged[merged.length - 1];
    if (last && iv.s <= last.e) {
      last.e = Math.max(last.e, iv.e);
    } else {
      merged.push({ ...iv });
    }
  }

  const gaps: { s: number; e: number }[] = [];
  let cursor = OFFICE_START_MIN;
  for (const iv of merged) {
    if (iv.s > cursor) gaps.push({ s: cursor, e: Math.min(iv.s, OFFICE_END_MIN) });
    cursor = Math.max(cursor, iv.e);
    if (cursor >= OFFICE_END_MIN) break;
  }
  if (cursor < OFFICE_END_MIN) gaps.push({ s: cursor, e: OFFICE_END_MIN });

  const requestedStart = toMinutes(start);
  const suggestions: Slot[] = [];

  for (const gap of gaps) {
    if (gap.e - gap.s < duration) continue;
    let slotStart = Math.max(gap.s, requestedStart);
    if (slotStart + duration > gap.e) slotStart = gap.s;
    if (slotStart + duration <= gap.e) {
      suggestions.push({
        start: toHHMM(slotStart),
        end: toHHMM(slotStart + duration),
      });
    }
    if (suggestions.length >= max) break;
  }

  return suggestions;
}
