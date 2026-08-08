import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import {
    useGetMasterScheduleQuery,
    useRespondToMeetingMutation,
    type ScheduleMeeting,
} from "@/redux/api/meetingApi";
import { useGetProjectManagersQuery } from "@/redux/api/adminDashboard/proposalApi";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const DAY_LABELS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

/** Hours rendered in the grid. The body scrolls vertically to reach them all. */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Stable per-manager colour. Meetings on unassigned projects fall back to slate
 * so they still read as "not yet someone's".
 */
const MANAGER_COLORS = [
    { bg: "bg-indigo-200", border: "border-indigo-400", text: "text-indigo-900" },
    { bg: "bg-emerald-200", border: "border-emerald-400", text: "text-emerald-900" },
    { bg: "bg-amber-200", border: "border-amber-400", text: "text-amber-900" },
    { bg: "bg-rose-200", border: "border-rose-400", text: "text-rose-900" },
    { bg: "bg-sky-200", border: "border-sky-400", text: "text-sky-900" },
    { bg: "bg-violet-200", border: "border-violet-400", text: "text-violet-900" },
];
const UNASSIGNED_COLOR = {
    bg: "bg-slate-200",
    border: "border-slate-400",
    text: "text-slate-800",
};

function colorForManager(managerId: string | null) {
    if (!managerId) return UNASSIGNED_COLOR;
    let hash = 0;
    for (let i = 0; i < managerId.length; i++) {
        hash = (hash * 31 + managerId.charCodeAt(i)) >>> 0;
    }
    return MANAGER_COLORS[hash % MANAGER_COLORS.length];
}

/** Sunday of the week containing `d`, at local midnight. */
function startOfWeek(d: Date) {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    out.setDate(out.getDate() - out.getDay());
    return out;
}

const formatHour = (h: number) => {
    if (h === 0) return "12 am";
    if (h === 12) return "12 pm";
    return h < 12 ? `${h} am` : `${h - 12} pm`;
};

export default function MasterScheduleTab() {
    const user = useAppSelector(selectCurrentUser) as any;
    const isPrivileged = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [managerId, setManagerId] = useState<string>("");
    const [selected, setSelected] = useState<ScheduleMeeting | null>(null);

    const weekEnd = useMemo(() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        return d;
    }, [weekStart]);

    const { data, isLoading, isFetching } = useGetMasterScheduleQuery({
        managerId: managerId || undefined,
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
    });

    const { data: managersData } = useGetProjectManagersQuery(undefined, {
        skip: !isPrivileged,
    });

    const [respondToMeeting, { isLoading: isResponding }] = useRespondToMeetingMutation();

    const meetings = data?.data || [];
    const managers: any[] = (managersData as any)?.data || [];

    const days = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + i);
                return d;
            }),
        [weekStart]
    );

    // Bucket meetings by "dayIndex-hour" so each cell is a cheap lookup.
    const byCell = useMemo(() => {
        const map = new Map<string, ScheduleMeeting[]>();
        meetings.forEach((m) => {
            const dt = new Date(m.scheduledAt);
            const dayIdx = days.findIndex(
                (d) =>
                    d.getFullYear() === dt.getFullYear() &&
                    d.getMonth() === dt.getMonth() &&
                    d.getDate() === dt.getDate()
            );
            if (dayIdx === -1) return;
            const key = `${dayIdx}-${dt.getHours()}`;
            map.set(key, [...(map.get(key) || []), m]);
        });
        return map;
    }, [meetings, days]);

    const shiftWeek = (delta: number) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + delta * 7);
        setWeekStart(d);
    };

    const handleRespond = async (meeting: ScheduleMeeting, action: "accept" | "reject") => {
        try {
            await respondToMeeting({ meetingId: meeting.id, action }).unwrap();
            toast.success(action === "accept" ? "Meeting confirmed." : "Meeting rejected.");
            setSelected(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update meeting");
        }
    };

    const monthLabel = weekStart.toLocaleDateString("en-US", { month: "long" });
    const yearLabel = weekStart.getFullYear();

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{monthLabel}</h3>
                    <p className="text-xs text-gray-400 font-medium">{yearLabel}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {isPrivileged && (
                        <select
                            value={managerId}
                            onChange={(e) => setManagerId(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
                        >
                            <option value="">All schedules</option>
                            {managers.map((m: any) => (
                                <option key={m.id} value={m.id}>
                                    {m.name || m.email}
                                </option>
                            ))}
                        </select>
                    )}

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => shiftWeek(-1)}
                            aria-label="Previous week"
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setWeekStart(startOfWeek(new Date()))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 active:scale-95"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => shiftWeek(1)}
                            aria-label="Next week"
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {(isLoading || isFetching) && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    )}
                </div>
            </div>

            {/* Calendar */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Day header */}
                <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] bg-gray-50 border-b border-gray-200">
                    <div className="p-2 text-[10px] font-black text-gray-400 uppercase">am/pm</div>
                    {days.map((d, i) => {
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                            <div
                                key={i}
                                className={`p-2 text-center border-l border-gray-200 ${
                                    isToday ? "bg-blue-50" : ""
                                }`}
                            >
                                <div className="text-xs font-bold text-gray-900">
                                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </div>
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-tight">
                                    {DAY_LABELS[i]}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Hour rows — scrolls vertically to reach all 24 */}
                <div className="max-h-[520px] overflow-y-auto">
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] border-b border-gray-100 last:border-b-0"
                        >
                            <div className="p-2 text-[10px] font-bold text-gray-400 text-right">
                                {formatHour(hour)}
                            </div>
                            {days.map((_, dayIdx) => {
                                const cellMeetings = byCell.get(`${dayIdx}-${hour}`) || [];
                                const isWeekend = dayIdx === 0 || dayIdx === 6;
                                return (
                                    <div
                                        key={dayIdx}
                                        className={`min-h-[44px] border-l border-gray-100 p-0.5 space-y-0.5 ${
                                            isWeekend ? "bg-gray-50/60" : ""
                                        }`}
                                    >
                                        {cellMeetings.map((m) => {
                                            const color = colorForManager(m.managerId);
                                            const isRequest = m.status === "PENDING_CLIENT_REQUEST";
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelected(m)}
                                                    title={`${m.projectName} — ${m.clientName}`}
                                                    className={`w-full text-left px-1.5 py-1 rounded border ${color.bg} ${color.border} ${color.text} hover:brightness-95 transition-all`}
                                                    style={
                                                        isRequest
                                                            ? {
                                                                  backgroundImage:
                                                                      "repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0 4px, transparent 4px 8px)",
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <span className="block text-[9px] font-black leading-tight truncate">
                                                        {m.title}
                                                        {isRequest && " (Request)"}
                                                    </span>
                                                    <span className="block text-[8px] leading-tight truncate opacity-80">
                                                        {m.projectName}
                                                    </span>
                                                    {m.clientName && (
                                                        <span className="block text-[8px] leading-tight truncate opacity-70">
                                                            ({m.clientName})
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 flex-wrap text-[10px] text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span
                        className="w-4 h-3 rounded border border-slate-400 bg-slate-200"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0 4px, transparent 4px 8px)",
                        }}
                    />
                    Requested — awaiting confirmation
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-3 rounded border border-indigo-400 bg-indigo-200" />
                    Colour indicates the assigned manager
                </span>
            </div>

            {/* Meeting detail / confirm-reject */}
            {selected && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">{selected.projectName}</p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-2 text-sm">
                            <p>
                                <span className="text-gray-500">When: </span>
                                {new Date(selected.scheduledAt).toLocaleString()}
                            </p>
                            {selected.clientName && (
                                <p>
                                    <span className="text-gray-500">Client: </span>
                                    {selected.clientName}
                                </p>
                            )}
                            <p>
                                <span className="text-gray-500">Manager: </span>
                                {selected.managerName || "Unassigned"}
                            </p>
                            <p>
                                <span className="text-gray-500">Status: </span>
                                <span className="font-bold uppercase">{selected.status}</span>
                            </p>
                            {selected.notes && (
                                <p className="text-gray-600 pt-1 border-t border-gray-100 mt-2">
                                    {selected.notes}
                                </p>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                            {selected.status === "PENDING_CLIENT_REQUEST" ? (
                                <>
                                    <button
                                        onClick={() => handleRespond(selected, "reject")}
                                        disabled={isResponding}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleRespond(selected, "accept")}
                                        disabled={isResponding}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isResponding ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Confirm
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setSelected(null)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
