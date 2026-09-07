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

/**
 * The zone the firm's office hours are expressed in.
 *
 * Office hours are the studio's wall-clock hours, so "12:00 to 18:00" means
 * noon to six *in California*, for everyone. A viewer elsewhere sees the same
 * instants rendered in their own time — from Dhaka a 1pm–8pm Pacific window
 * shows up as 2am–9am local, and only those slots are bookable.
 *
 * Kept identical to STUDIO_TIME_ZONE in the API's project-request service: the
 * grid must grey out exactly what the server would refuse.
 */
export const STUDIO_TIME_ZONE = "America/Los_Angeles";

/** Minutes past midnight for `date`, read in `timeZone`. */
export function zonedMinutes(date: Date, timeZone = STUDIO_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    // h23 rather than hour12:false — the latter reports midnight as "24" on
    // some ICU builds, which would read as the end of the day, not the start.
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const valueOf = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return valueOf("hour") * 60 + valueOf("minute");
}

/**
 * Whether a slot beginning at `start` and running `durationMinutes` falls
 * inside the studio's opening window. Both ends are compared in studio time,
 * never the viewer's, which is what makes the window mean the same thing from
 * California and from Dhaka.
 */
export function isWithinOfficeHours(
  start: Date,
  durationMinutes: number,
  officeHours?: { start: string; end: string } | null,
): boolean {
  const open = parseTimeToMinutes(officeHours?.start);
  const close = parseTimeToMinutes(officeHours?.end);
  // A missing or malformed setting must not black out the whole grid.
  if (open === null || close === null) return true;

  const studioStart = zonedMinutes(start);
  return studioStart >= open && studioStart + durationMinutes <= close;
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
     * Firm-wide booking window as "HH:MM" times in the studio's zone. Slots
     * outside it are marked busy so the grid matches what the server will
     * accept — a client picking 7am against 8am office hours would otherwise
     * only find out on submit.
     */
    officeHours?: { start: string; end: string } | null;
  } = {}
): DaySlot[] {
  const now = options.now ?? new Date();
  const dayStart = startOfDay(day);

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

    // Compared in studio time, not the viewer's: `minutes` is local, the window
    // is Californian, and comparing the two directly is what left a Dhaka
    // client staring at a grid where every open hour was greyed out.
    const outsideOfficeHours = !isWithinOfficeHours(
      start,
      SLOT_MINUTES,
      options.officeHours,
    );

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
