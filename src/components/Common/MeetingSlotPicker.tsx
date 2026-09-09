import { useEffect, useMemo } from "react";
import { CalendarDays, Loader2, Lock, Ban, Clock } from "lucide-react";
import { useGetAvailabilityQuery } from "@/redux/api/meetingApi";
import {
    SLOT_MINUTES,
    buildDaySlots,
    formatSlotLabel,
    fromDateInputValue,
    isOpenDay,
    isRangeAvailable,
    slotDateTime,
    startOfDay,
    toDateInputValue,
    WEEKDAY_LABELS,
    type DaySlot,
} from "@/utils/scheduleSlots";
import { useGetOfficeHoursQuery } from "@/redux/api/adminDashboard/siteSettingsApi";

export interface SlotSelection {
    /** Local `yyyy-mm-dd`. Empty until a day is chosen. */
    date: string;
    /** Minutes since midnight, or null when unset. */
    startMinutes: number | null;
    endMinutes: number | null;
}

export const EMPTY_SLOT_SELECTION: SlotSelection = {
    date: "",
    startMinutes: null,
    endMinutes: null,
};

interface MeetingSlotPickerProps {
    value: SlotSelection;
    onChange: (next: SlotSelection) => void;
    /** Client side — the assigned manager's calendar is resolved server-side. */
    projectRequestId?: string;
    /** Staff side — inspect a specific manager's calendar. */
    managerId?: string;
    /**
     * Ignore this meeting when working out what's taken — set when re-timing or
     * attaching a link to an existing booking, so it doesn't block itself.
     */
    excludeMeetingId?: string;
    disabled?: boolean;
    /** Tailwind ring/accent colour family, to match the surrounding form. */
    accent?: "blue" | "emerald" | "amber";
}

const ACCENTS = {
    blue: {
        ring: "focus:ring-blue-500",
        selected: "bg-blue-600 border-blue-600 text-white",
        inRange: "bg-blue-100 border-blue-300 text-blue-900",
    },
    emerald: {
        ring: "focus:ring-emerald-500",
        selected: "bg-emerald-600 border-emerald-600 text-white",
        inRange: "bg-emerald-100 border-emerald-300 text-emerald-900",
    },
    amber: {
        ring: "focus:ring-amber-500",
        selected: "bg-amber-600 border-amber-600 text-white",
        inRange: "bg-amber-100 border-amber-300 text-amber-900",
    },
} as const;

/**
 * Pick a meeting window on a 30-minute grid.
 *
 * Slots the assigned manager already has booked — or has blocked off as time
 * away — render greyed out and cannot be selected, so a client never proposes
 * a time the server would reject. Selecting a start then an end books a range;
 * selecting only a start books one 30-minute slot.
 */
export default function MeetingSlotPicker({
    value,
    onChange,
    projectRequestId,
    managerId,
    excludeMeetingId,
    disabled,
    accent = "blue",
}: MeetingSlotPickerProps) {
    const colors = ACCENTS[accent];
    const today = useMemo(() => startOfDay(new Date()), []);
    // Memoised so the slot list below keeps a stable identity between renders.
    const selectedDay = useMemo(
        () => (value.date ? fromDateInputValue(value.date) : null),
        [value.date]
    );

    // Only the chosen day's availability is fetched — one lightweight request
    // per day the user looks at.
    const range = useMemo(() => {
        const day = selectedDay ?? today;
        const from = startOfDay(day);
        const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
        return { from: from.toISOString(), to: to.toISOString() };
    }, [selectedDay, today]);

    const { data, isFetching } = useGetAvailabilityQuery(
        {
            projectRequestId,
            managerId,
            excludeMeetingId,
            from: range.from,
            to: range.to,
        },
        { skip: !value.date || (!projectRequestId && !managerId) }
    );

    const busy = data?.data?.busy || [];

    // The studio's booking window. The server rejects anything outside it, so
    // the grid greys those slots out rather than letting a client pick one.
    const { data: officeHoursData } = useGetOfficeHoursQuery();
    const officeHours = officeHoursData?.data ?? null;

    const slots: DaySlot[] = useMemo(
        () =>
            selectedDay
                ? buildDaySlots(selectedDay, busy, { officeHours })
                : [],
        [selectedDay, busy, officeHours]
    );

    // A slot that becomes unavailable while it is selected (someone else booked
    // it first) has to be dropped, or the form would submit a dead range.
    useEffect(() => {
        if (value.startMinutes === null || slots.length === 0) return;
        const end = value.endMinutes ?? value.startMinutes + SLOT_MINUTES;
        if (!isRangeAvailable(slots, value.startMinutes, end)) {
            onChange({ ...value, startMinutes: null, endMinutes: null });
        }
        // `onChange`/`value` identities change every render in most parents;
        // the slot list is what actually matters here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slots]);

    const handleSlotClick = (slot: DaySlot) => {
        if (disabled || slot.busy || slot.past) return;

        const { startMinutes, endMinutes } = value;

        // No start yet, or restarting after a complete range: begin a new one.
        if (startMinutes === null || endMinutes !== null) {
            onChange({ ...value, startMinutes: slot.minutes, endMinutes: null });
            return;
        }

        // Clicking the start again collapses back to a single slot.
        if (slot.minutes === startMinutes) {
            onChange({
                ...value,
                startMinutes: slot.minutes,
                endMinutes: slot.minutes + SLOT_MINUTES,
            });
            return;
        }

        // Clicking earlier than the start just moves the start.
        if (slot.minutes < startMinutes) {
            onChange({ ...value, startMinutes: slot.minutes, endMinutes: null });
            return;
        }

        const proposedEnd = slot.minutes + SLOT_MINUTES;
        if (!isRangeAvailable(slots, startMinutes, proposedEnd)) {
            // Something taken sits between the two clicks — treat it as a fresh
            // start instead of silently booking across it.
            onChange({ ...value, startMinutes: slot.minutes, endMinutes: null });
            return;
        }

        onChange({ ...value, startMinutes, endMinutes: proposedEnd });
    };

    const effectiveEnd =
        value.startMinutes === null
            ? null
            : value.endMinutes ?? value.startMinutes + SLOT_MINUTES;

    const hasBlockedTime = busy.some((b) => b.type === "BLOCK");

    // "Saturday and Sunday" — only worth saying when the studio isn't open all
    // week, so a firm with no closed days sees no extra copy.
    const openDaysLabel = useMemo(() => {
        const days = officeHours?.days;
        if (!days || days.length === 0 || days.length === 7) return "";
        const names = WEEKDAY_LABELS.filter((d) => days.includes(d.value)).map(
            (d) => d.label,
        );
        if (names.length === 1) return names[0];
        return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    }, [officeHours]);

    /** Start times that are free — the options for the Start dropdown. */
    const startOptions = slots.filter((s) => !s.busy && !s.past);

    /**
     * End times reachable from the chosen start: every slot boundary up to the
     * first taken slot, so a range can never step over a booked half hour.
     */
    const endOptions = useMemo(() => {
        if (value.startMinutes === null) return [];
        const out: { minutes: number; label: string }[] = [];
        for (
            let m = value.startMinutes;
            m < 24 * 60;
            m += SLOT_MINUTES
        ) {
            const slot = slots.find((s) => s.minutes === m);
            if (!slot || slot.busy || slot.past) break;
            out.push({
                minutes: m + SLOT_MINUTES,
                label: formatSlotLabel((m + SLOT_MINUTES) % (24 * 60)),
            });
        }
        return out;
    }, [slots, value.startMinutes]);

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="date"
                        value={value.date}
                        min={toDateInputValue(today)}
                        disabled={disabled}
                        onChange={(e) =>
                            onChange({
                                date: e.target.value,
                                startMinutes: null,
                                endMinutes: null,
                            })
                        }
                        // `w-full` alone is not enough on iOS Safari: WebKit
                        // sizes a date input from its own content and leaves
                        // the declared width unapplied, so the box stopped
                        // short of the time selects below it. `appearance-none`
                        // drops that native sizing and `min-w-full` holds the
                        // field to the column either way. The calendar icon on
                        // desktop is a separate shadow element and is untouched.
                        // min-h matches the start/end selects below (text-sm
                        // line-height 20px + py-2 + 1px borders), so an empty
                        // field keeps its box now that appearance-none has
                        // removed WebKit's intrinsic height.
                        className={`block w-full min-w-full min-h-[38px] appearance-none px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${colors.ring} disabled:bg-gray-100 disabled:text-gray-400`}
                    />
                </div>
            </div>

            {!value.date ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-4">
                    <CalendarDays className="w-4 h-4" />
                    Pick a date to see the available times.
                    {openDaysLabel && (
                        <span className="text-gray-400">
                            We're open {openDaysLabel}.
                        </span>
                    )}
                </div>
            ) : selectedDay && !isOpenDay(selectedDay, officeHours) ? (
                // Said plainly rather than shown as a grid of greyed-out slots:
                // a whole day of disabled buttons reads as a fault, not a
                // closure. The server refuses these days too.
                <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-4">
                    <CalendarDays className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                        The office is closed that day.
                        {openDaysLabel
                            ? ` We take meetings on ${openDaysLabel} — please pick one of those.`
                            : " Please pick another date."}
                    </span>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-900">
                            Time <span className="text-red-500">*</span>
                        </label>
                        {isFetching && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                        )}
                    </div>
                    {/* Explicit start/end pickers — the grid below is the same
                        selection shown as availability. */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Start time
                            </label>
                            <select
                                value={value.startMinutes ?? ""}
                                disabled={disabled}
                                onChange={(e) => {
                                    const next = e.target.value === "" ? null : Number(e.target.value);
                                    onChange({ ...value, startMinutes: next, endMinutes: null });
                                }}
                                className={`w-full px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${colors.ring} disabled:bg-gray-100`}
                            >
                                <option value="">Select</option>
                                {startOptions.map((s) => (
                                    <option key={s.minutes} value={s.minutes}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                End time
                            </label>
                            <select
                                value={effectiveEnd ?? ""}
                                disabled={disabled || value.startMinutes === null}
                                onChange={(e) =>
                                    onChange({
                                        ...value,
                                        endMinutes: e.target.value === "" ? null : Number(e.target.value),
                                    })
                                }
                                className={`w-full px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${colors.ring} disabled:bg-gray-100 disabled:text-gray-400`}
                            >
                                {value.startMinutes === null ? (
                                    <option value="">Pick a start first</option>
                                ) : (
                                    endOptions.map((o) => (
                                        <option key={o.minutes} value={o.minutes}>
                                            {o.label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-2">
                        Or click a start time below, then an end time. Greyed-out times
                        are already booked or blocked off.
                    </p>

                    {/* The grid is drawn in the studio's own timezone, not the
                        viewer's — see scheduleSlots, where the office window is
                        Californian. Said out loud so a client booking from
                        another timezone knows which clock these times are on,
                        rather than turning up an hour or a day out. */}
                    <p className="text-[11px] font-medium text-gray-600 mb-2">
                        Please note that all appointment times shown are in the Pacific
                        Standard Time (PST) zone.
                    </p>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1 border border-gray-200 rounded-lg p-2 bg-white">
                        {slots.map((slot) => {
                            const unavailable = slot.busy || slot.past;
                            const isStart = slot.minutes === value.startMinutes;
                            const inRange =
                                value.startMinutes !== null &&
                                effectiveEnd !== null &&
                                slot.minutes >= value.startMinutes &&
                                slot.minutes < effectiveEnd;

                            return (
                                <button
                                    key={slot.minutes}
                                    type="button"
                                    disabled={disabled || unavailable}
                                    onClick={() => handleSlotClick(slot)}
                                    title={
                                        slot.busyReason === "BLOCK" && slot.busy
                                            ? `Unavailable — ${slot.busyLabel}`
                                            : slot.busy
                                                ? "Already booked"
                                                : slot.past
                                                    ? "In the past"
                                                    : slot.tentative
                                                        ? `Awaiting confirmation — ${slot.busyLabel}. You can still pick this time.`
                                                        : slot.label
                                    }
                                    className={`px-1.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${unavailable
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                                        : isStart
                                            ? `${colors.selected} cursor-pointer`
                                            : inRange
                                                ? `${colors.inRange} cursor-pointer`
                                                : slot.tentative
                                                    ? "bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-500 cursor-pointer"
                                                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 cursor-pointer"
                                        }`}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {slot.busyReason === "BLOCK" && slot.busy && (
                                            <Ban className="w-2.5 h-2.5" />
                                        )}
                                        {slot.busyReason === "MEETING" && slot.busy && (
                                            <Lock className="w-2.5 h-2.5" />
                                        )}
                                        {slot.tentative && <Clock className="w-2.5 h-2.5" />}
                                        {slot.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {hasBlockedTime && (
                        <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Your project manager has blocked off part of this day.
                        </p>
                    )}

                    {slots.some((s) => s.tentative) && (
                        <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Amber times have a request awaiting confirmation — still
                            bookable.
                        </p>
                    )}

                    {value.startMinutes !== null && effectiveEnd !== null && (
                        <p className="text-xs text-gray-700 mt-2">
                            Selected:{" "}
                            <span className="font-semibold">
                                {formatSlotLabel(value.startMinutes)} –{" "}
                                {formatSlotLabel(effectiveEnd % (24 * 60))}
                            </span>{" "}
                            <span className="text-gray-400">
                                ({(effectiveEnd - value.startMinutes) / SLOT_MINUTES} ×{" "}
                                {SLOT_MINUTES} min)
                            </span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Turn a picker value into the ISO pair the API expects. Returns null when the
 * selection is incomplete.
 */
export function toMeetingWindow(
    value: SlotSelection
): { scheduledAt: string; endsAt: string } | null {
    const day = value.date ? fromDateInputValue(value.date) : null;
    if (!day || value.startMinutes === null) return null;

    const endMinutes = value.endMinutes ?? value.startMinutes + SLOT_MINUTES;
    return {
        scheduledAt: slotDateTime(day, value.startMinutes).toISOString(),
        endsAt: slotDateTime(day, endMinutes).toISOString(),
    };
}
