import type { BusyRange } from "@/redux/api/meetingApi";

/** Minutes past midnight for an "HH:MM" string, or null if it isn't one. */
export function parseTimeToMinutes(value?: string | null): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? "").trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Booking granularity. Every calendar in the app — client request modal, studio
 * meeting forms, master schedule — renders and validates on this grid, so a
 * range picked in one place always lines up with a range picked in another.
 */
export const SLOT_MINUTES = 30;
export const SLOT_MS = SLOT_MINUTES * 60 * 1000;

/** Slots per day, used to size the day grid. */
export const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;

export interface DaySlot {
  /** Minutes from local midnight — 0, 30, 60 … */
  minutes: number;
  start: Date;
  end: Date;
  /** "9:00 AM" */
  label: string;
  /**
   * Truly unavailable — a confirmed meeting or the manager's blocked-off time.
   * Only these are unselectable.
   */
  busy: boolean;
  /**
   * Overlapped by a meeting still awaiting a reply. Worth showing, but it does
   * not reserve the slot, so it stays selectable.
   */
  tentative: boolean;
  busyReason: "MEETING" | "BLOCK" | "CLOSED" | null;
  busyLabel: string | null;
  /** Already gone — can't book into the past. */
  past: boolean;
}

/** Local midnight of the day containing `d`. */
export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Local midnight of the Sunday that starts `d`'s week. */
export function startOfWeek(d: Date): Date {
  const out = startOfDay(d);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** "9:00 AM" / "1:30 PM" from minutes-since-midnight. */
export function formatSlotLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** `<input type="date">` value for a local date, without UTC drift. */
export function toDateInputValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Local midnight for a `yyyy-mm-dd` string (never parsed as UTC). */
export function fromDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    0,
    0,
    0,
    0
  );
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Every 30-minute slot in a day, tagged with whether it is already taken.
 * `busy` comes straight from the availability endpoint, so a slot the server
 * would reject is a slot this grid renders as unavailable.
 */
export function buildDaySlots(
  day: Date,
  busy: BusyRange[],
  options: {
    now?: Date;
    /**
     * Firm-wide booking window as local "HH:MM" times. Slots outside it are
     * marked busy so the grid matches what the server will accept — a client
     * picking 7am against 8am office hours would otherwise only find out on
     * submit.
     */
    officeHours?: { start: string; end: string } | null;
  } = {}
): DaySlot[] {
  const now = options.now ?? new Date();
  const dayStart = startOfDay(day);

  const officeOpen = parseTimeToMinutes(options.officeHours?.start);
  const officeClose = parseTimeToMinutes(options.officeHours?.end);

  const ranges = busy.map((b) => ({
    start: new Date(b.start),
    end: new Date(b.end),
    type: b.type,
    label: b.label,
    // Older payloads predate the flag; treat anything unmarked as blocking so
    // the grid errs towards protecting the slot.
    blocking: b.blocking !== false,
  }));

  return Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
    const minutes = i * SLOT_MINUTES;
    const start = new Date(dayStart.getTime() + minutes * 60 * 1000);
    const end = new Date(start.getTime() + SLOT_MS);

    const hits = ranges.filter((r) => overlaps(start, end, r.start, r.end));
    // Blocked time wins the label — it explains *why* nothing can be booked.
    const blockingHit =
      hits.find((r) => r.type === "BLOCK" && r.blocking) ??
      hits.find((r) => r.blocking);
    const tentativeHit = hits.find((r) => !r.blocking);
    const hit = blockingHit ?? tentativeHit;

    const outsideOfficeHours =
      officeOpen !== null &&
      officeClose !== null &&
      (minutes < officeOpen || minutes + SLOT_MINUTES > officeClose);

    return {
      minutes,
      start,
      end,
      label: formatSlotLabel(minutes),
      busy: Boolean(blockingHit) || outsideOfficeHours,
      tentative: !blockingHit && Boolean(tentativeHit),
      busyReason: outsideOfficeHours && !blockingHit ? "CLOSED" : hit?.type ?? null,
      busyLabel:
        outsideOfficeHours && !blockingHit ? "Outside office hours" : hit?.label ?? null,
      past: end <= now,
    };
  });
}

/**
 * Whether [startMinutes, endMinutes) is bookable — every slot it spans must be
 * free. A range that steps over a taken slot is rejected here rather than at
 * the server.
 */
export function isRangeAvailable(
  slots: DaySlot[],
  startMinutes: number,
  endMinutes: number
): boolean {
  if (endMinutes <= startMinutes) return false;
  return slots
    .filter((s) => s.minutes >= startMinutes && s.minutes < endMinutes)
    .every((s) => !s.busy && !s.past);
}

/** Combine a day with minutes-since-midnight into a local Date. */
export function slotDateTime(day: Date, minutes: number): Date {
  const out = startOfDay(day);
  out.setMinutes(minutes);
  return out;
}
