import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  X,
  Ban,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetMasterScheduleQuery,
  useRespondToMeetingMutation,
  useGetScheduleBlocksQuery,
  useCreateScheduleBlockMutation,
  useUpdateScheduleBlockMutation,
  useDeleteScheduleBlockMutation,
  type ScheduleMeeting,
  type ScheduleBlock,
} from "@/redux/api/meetingApi";
import { useGetProjectManagersQuery } from "@/redux/api/adminDashboard/proposalApi";
import {
  useGetOfficeHoursQuery,
  useUpdateOfficeHoursMutation,
} from "@/redux/api/adminDashboard/siteSettingsApi";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import {
  SLOT_MINUTES,
  SLOTS_PER_DAY,
  formatSlotLabel,
  startOfWeek,
  toDateInputValue,
  WEEKDAY_LABELS,
} from "@/utils/scheduleSlots";

const DAY_LABELS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/** Local "HH:MM" for an <input type="time">. */
const toTimeInputValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/** Rows rendered in the grid — one per 30-minute slot. The body scrolls. */
const SLOT_INDEXES = Array.from({ length: SLOTS_PER_DAY }, (_, i) => i);

/**
 * Every half-hour of the day, as "HH:MM" values with readable labels — the
 * exact grid clients book on, so office hours can only ever be set to a
 * boundary a real slot starts at.
 */
const SLOT_TIME_OPTIONS = SLOT_INDEXES.map((index) => {
  const minutes = index * SLOT_MINUTES;
  return {
    value: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60,
    ).padStart(2, "0")}`,
    label: formatSlotLabel(minutes),
  };
});

/**
 * Stable per-manager colour. Meetings on unassigned projects fall back to slate
 * so they still read as "not yet someone's".
 */
const MANAGER_COLORS = [
  { bg: "bg-indigo-200", border: "border-indigo-400", text: "text-indigo-900" },
  {
    bg: "bg-emerald-200",
    border: "border-emerald-400",
    text: "text-emerald-900",
  },
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

const EMPTY_BLOCK_FORM = {
  title: "",
  notes: "",
  date: "",
  endDate: "",
  startTime: "09:00",
  endTime: "17:00",
  allDay: false,
};

export default function MasterScheduleTab() {
  const user = useAppSelector(selectCurrentUser) as any;
  const isPrivileged = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [managerId, setManagerId] = useState<string>("");
  const [selected, setSelected] = useState<ScheduleMeeting | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(
    null,
  );
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  /** Set while the form is editing an existing block rather than creating one. */
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK_FORM);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const rangeArgs = {
    managerId: managerId || undefined,
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  };

  const { data, isLoading, isFetching } = useGetMasterScheduleQuery(rangeArgs);
  const { data: blocksData, isFetching: isFetchingBlocks } =
    useGetScheduleBlocksQuery(rangeArgs);

  const { data: managersData } = useGetProjectManagersQuery(undefined, {
    skip: !isPrivileged,
  });

  const [respondToMeeting, { isLoading: isResponding }] =
    useRespondToMeetingMutation();
  const [createScheduleBlock, { isLoading: isBlocking }] =
    useCreateScheduleBlockMutation();
  const [updateScheduleBlock, { isLoading: isUpdatingBlock }] =
    useUpdateScheduleBlockMutation();
  const [deleteScheduleBlock, { isLoading: isDeletingBlock }] =
    useDeleteScheduleBlockMutation();

  const meetings = data?.data || [];
  const blocks = blocksData?.data || [];
  const managers: any[] = (managersData as any)?.data || [];

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  /**
   * Which cell a moment belongs to, on the 30-minute grid. Returns null when
   * it falls outside the week on screen.
   */
  const cellFor = (moment: Date) => {
    const dayIdx = days.findIndex(
      (d) =>
        d.getFullYear() === moment.getFullYear() &&
        d.getMonth() === moment.getMonth() &&
        d.getDate() === moment.getDate(),
    );
    if (dayIdx === -1) return null;
    const slotIdx = Math.floor(
      (moment.getHours() * 60 + moment.getMinutes()) / SLOT_MINUTES,
    );
    return { dayIdx, slotIdx };
  };

  // A meeting occupies every slot it spans, so a 90-minute call reads as three
  // half-hour rows rather than a single mark at its start.
  const meetingsByCell = useMemo(() => {
    const map = new Map<string, ScheduleMeeting[]>();
    meetings.forEach((m) => {
      const start = new Date(m.scheduledAt);
      const end = m.endsAt
        ? new Date(m.endsAt)
        : new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

      for (
        let cursor = new Date(start);
        cursor < end;
        cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES)
      ) {
        const cell = cellFor(cursor);
        if (!cell) continue;
        const key = `${cell.dayIdx}-${cell.slotIdx}`;
        map.set(key, [...(map.get(key) || []), m]);
      }
    });
    return map;
  }, [meetings, days]);

  const blocksByCell = useMemo(() => {
    const map = new Map<string, ScheduleBlock>();
    blocks.forEach((b) => {
      const start = new Date(b.startAt);
      const end = new Date(b.endAt);
      for (
        let cursor = new Date(start);
        cursor < end;
        cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES)
      ) {
        const cell = cellFor(cursor);
        if (!cell) continue;
        map.set(`${cell.dayIdx}-${cell.slotIdx}`, b);
      }
    });
    return map;
  }, [blocks, days]);

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  };

  const handleRespond = async (
    meeting: ScheduleMeeting,
    action: "accept" | "reject",
  ) => {
    try {
      await respondToMeeting({ meetingId: meeting.id, action }).unwrap();
      toast.success(
        action === "accept" ? "Meeting confirmed." : "Meeting rejected.",
      );
      setSelected(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update meeting");
    }
  };

  const openBlockForm = () => {
    const today = toDateInputValue(new Date());
    setEditingBlockId(null);
    setBlockForm({ ...EMPTY_BLOCK_FORM, date: today, endDate: today });
    setIsBlockFormOpen(true);
  };

  /** Reopen the form on an existing block so its dates/hours can be changed. */
  const openBlockForEdit = (block: ScheduleBlock) => {
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    setEditingBlockId(block.id);
    setBlockForm({
      title: block.title || "",
      notes: block.notes || "",
      date: toDateInputValue(start),
      endDate: toDateInputValue(end),
      startTime: toTimeInputValue(start),
      endTime: toTimeInputValue(end),
      allDay: !!block.allDay,
    });
    setIsBlockFormOpen(true);
  };

  const handleSaveBlock = async () => {
    if (!blockForm.title.trim()) {
      toast.error("Give the time off a name (e.g. Site visit).");
      return;
    }
    if (!blockForm.date) {
      toast.error("Pick a start date.");
      return;
    }

    const endDate = blockForm.allDay
      ? blockForm.endDate || blockForm.date
      : blockForm.date;

    const startAt = new Date(
      `${blockForm.date}T${blockForm.allDay ? "00:00" : blockForm.startTime}`,
    );
    const endAt = new Date(
      `${endDate}T${blockForm.allDay ? "23:59" : blockForm.endTime}`,
    );

    if (endAt <= startAt) {
      toast.error("The block has to end after it starts.");
      return;
    }

    try {
      const res = editingBlockId
        ? await updateScheduleBlock({
            id: editingBlockId,
            title: blockForm.title.trim(),
            notes: blockForm.notes.trim() || "",
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            allDay: blockForm.allDay,
          }).unwrap()
        : await createScheduleBlock({
            // Privileged users may block another manager's calendar via
            // the filter above; a PM always blocks their own.
            userId: isPrivileged && managerId ? managerId : undefined,
            title: blockForm.title.trim(),
            notes: blockForm.notes.trim() || undefined,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            allDay: blockForm.allDay,
          }).unwrap();

      toast.success(
        res.message ||
          (editingBlockId ? "Time off updated." : "Time blocked off."),
      );
      setIsBlockFormOpen(false);
      setEditingBlockId(null);
      setBlockForm(EMPTY_BLOCK_FORM);
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          (editingBlockId
            ? "Failed to update this time off"
            : "Failed to block off this time"),
      );
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteScheduleBlock(id).unwrap();
      toast.success("Time off removed.");
      setSelectedBlock(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove time off");
    }
  };

  // ── Office hours (super admin only) ────────────────────────────────────
  // The firm-wide window clients may book meetings in. The backend enforces
  // it on every client booking; this is just where it gets set.
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const { data: officeHoursData } = useGetOfficeHoursQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const [updateOfficeHours, { isLoading: isSavingHours }] =
    useUpdateOfficeHoursMutation();
  const [officeHours, setOfficeHours] = useState<{
    start: string;
    end: string;
    days: number[];
  }>({ start: "", end: "", days: [] });

  // Seed the inputs once the saved window arrives, without clobbering edits.
  useEffect(() => {
    if (officeHoursData?.data) {
      setOfficeHours({
        start: officeHoursData.data.start,
        end: officeHoursData.data.end,
        // A window saved before open days existed has no list; treat that as
        // open all week rather than closed all week.
        days: officeHoursData.data.days ?? [0, 1, 2, 3, 4, 5, 6],
      });
    }
  }, [officeHoursData]);

  const toggleOfficeDay = (day: number) =>
    setOfficeHours((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort((a, b) => a - b),
    }));

  const handleSaveOfficeHours = async () => {
    if (!officeHours.start || !officeHours.end) {
      toast.error("Set both a start and an end time.");
      return;
    }
    if (officeHours.end <= officeHours.start) {
      toast.error("Office hours have to end after they start.");
      return;
    }
    // Nothing ticked would take the calendar offline entirely — no slot on any
    // day — which reads to a client as though booking is broken.
    if (officeHours.days.length === 0) {
      toast.error(
        "Tick at least one day the office is open, or no meeting can be booked at all.",
      );
      return;
    }
    try {
      await updateOfficeHours(officeHours).unwrap();
      const openDays = WEEKDAY_LABELS.filter((d) =>
        officeHours.days.includes(d.value),
      )
        .map((d) => d.label)
        .join(", ");
      toast.success(
        `Open ${officeHours.start}–${officeHours.end} on ${openDays}. Clients can only book then.`,
        { duration: 6000 },
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save office hours");
    }
  };

  const monthLabel = weekStart.toLocaleDateString("en-US", { month: "long" });
  const yearLabel = weekStart.getFullYear();

  const formatWindow = (meeting: ScheduleMeeting) => {
    const start = new Date(meeting.scheduledAt).toLocaleString();
    if (!meeting.endsAt) return start;
    const end = new Date(meeting.endsAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} – ${end}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      {/* Month + year */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">
          {monthLabel}
        </h3>
        <p className="text-xs text-gray-400 font-medium">{yearLabel}</p>
      </div>

      {/* Controls — three blocks side by side on large screens:
          office hours · (block time off + schedule filter) · week nav */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-3 mb-4">
        {/* 1 · Office hours (super admin only) */}
        {isSuperAdmin && (
          <div className="flex items-end gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <div>
              <label
                htmlFor="officeHoursStart"
                className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1"
              >
                Office Hours
              </label>

              {/* One box per weekday: ticked is open, unticked is closed, and
                  the times below apply only to the ticked days. This is what
                  lets a studio take meetings at weekends only. The same list
                  governs the New Project wizard and the client's request
                  modal, so a closed day offers no slot in either. */}
              <div className="flex items-center gap-1 mb-1.5">
                {WEEKDAY_LABELS.map((day) => {
                  const open = officeHours.days.includes(day.value);
                  return (
                    <label
                      key={day.value}
                      title={`${day.label} — ${open ? "open" : "closed"}`}
                      className="flex flex-col items-center gap-0.5 cursor-pointer select-none"
                    >
                      <span
                        className={`text-[9px] font-black uppercase ${
                          open ? "text-gray-700" : "text-gray-300"
                        }`}
                      >
                        {day.short}
                      </span>
                      <input
                        type="checkbox"
                        checked={open}
                        onChange={() => toggleOfficeDay(day.value)}
                        aria-label={`${day.label} — office open`}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-gray-900 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
              {/* A select of the same half-hour slots clients book on, rather
                  than <input type="time">: the native picker lists every
                  minute regardless of `step`, which invited office hours that
                  no bookable slot could ever line up with. */}
              <div className="flex items-center gap-1">
                <select
                  id="officeHoursStart"
                  value={officeHours.start}
                  onChange={(e) =>
                    setOfficeHours((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-800 cursor-pointer"
                >
                  {SLOT_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">to</span>
                <select
                  aria-label="Office hours end"
                  value={officeHours.end}
                  onChange={(e) =>
                    setOfficeHours((prev) => ({
                      ...prev,
                      end: e.target.value,
                    }))
                  }
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-800 cursor-pointer"
                >
                  {SLOT_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveOfficeHours}
              disabled={isSavingHours}
              title="Clients can only book meetings inside this window"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-md text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {isSavingHours && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        )}

        {/* 2 · Block time off + schedule filter, stacked */}
        <div className="flex flex-col gap-2">
          <div>
            <button
              onClick={openBlockForm}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 active:scale-95 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              Block Time Off
            </button>
          </div>

          {isPrivileged && (
            <div>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="">All schedules</option>
                {managers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 3 · Week navigation */}
        <div className="flex items-center gap-1 lg:ml-auto">
          <button
            onClick={() => shiftWeek(-1)}
            aria-label="Previous week"
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 active:scale-95 cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => shiftWeek(1)}
            aria-label="Next week"
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {(isLoading || isFetching || isFetchingBlocks) && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-1" />
          )}
        </div>
      </div>

      {/* Block time off form */}
      {isBlockFormOpen && (
        <div className="mb-4 border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Ban className="w-4 h-4" />
              Block Time Off
            </h4>
            <button
              onClick={() => setIsBlockFormOpen(false)}
              className="p-1 hover:bg-amber-100 rounded cursor-pointer"
            >
              <X className="w-4 h-4 text-amber-700" />
            </button>
          </div>
          <p className="text-xs text-amber-800">
            Clients assigned to{" "}
            {isPrivileged && managerId ? "this manager" : "you"} cannot book a
            meeting inside a blocked range.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={blockForm.title}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Site visit / Out of office / Vacation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer">
              <input
                type="checkbox"
                checked={blockForm.allDay}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, allDay: e.target.checked }))
                }
                className="w-4 h-4 accent-amber-600 cursor-pointer"
              />
              Whole day(s) — e.g. vacation
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                {blockForm.allDay ? "From" : "Date"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={blockForm.date}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, date: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {blockForm.allDay ? (
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={blockForm.endDate}
                  min={blockForm.date}
                  onChange={(e) =>
                    setBlockForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* Selects of the same half-hour slots, for the reason already
                    established on Office Hours above: the native time picker
                    lists every minute whatever `step` says, so a block could be
                    set to 9:07–5:23 and never line up with a bookable slot. */}
                <div>
                  <label
                    htmlFor="blockStartTime"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Start
                  </label>
                  <select
                    id="blockStartTime"
                    value={blockForm.startTime}
                    onChange={(e) =>
                      setBlockForm((p) => ({ ...p, startTime: e.target.value }))
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {SLOT_TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="blockEndTime"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    End
                  </label>
                  <select
                    id="blockEndTime"
                    value={blockForm.endTime}
                    onChange={(e) =>
                      setBlockForm((p) => ({ ...p, endTime: e.target.value }))
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {SLOT_TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={blockForm.notes}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional detail for your own reference"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveBlock}
              disabled={isBlocking || isUpdatingBlock}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              {isBlocking || isUpdatingBlock ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editingBlockId ? "Save Changes" : "Block This Time"}
            </button>
            <button
              onClick={() => setIsBlockFormOpen(false)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Day header */}
        <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] bg-gray-50 border-b border-gray-200">
          <div className="p-2 text-[10px] font-black text-gray-400 uppercase">
            am/pm
          </div>
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
                  {d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-tight">
                  {DAY_LABELS[i]}
                </div>
              </div>
            );
          })}
        </div>

        {/* 30-minute rows — scrolls vertically to reach the whole day */}
        <div className="max-h-[520px] overflow-y-auto">
          {SLOT_INDEXES.map((slotIdx) => {
            const minutes = slotIdx * SLOT_MINUTES;
            const isHourStart = minutes % 60 === 0;
            return (
              <div
                key={slotIdx}
                className={`grid grid-cols-[70px_repeat(7,minmax(0,1fr))] last:border-b-0 ${
                  isHourStart
                    ? "border-b border-gray-200"
                    : "border-b border-gray-50"
                }`}
              >
                <div
                  className={`p-1.5 text-[10px] text-right ${
                    isHourStart
                      ? "font-bold text-gray-500"
                      : "font-medium text-gray-300"
                  }`}
                >
                  {formatSlotLabel(minutes)}
                </div>
                {days.map((_, dayIdx) => {
                  const key = `${dayIdx}-${slotIdx}`;
                  const cellMeetings = meetingsByCell.get(key) || [];
                  const block = blocksByCell.get(key);
                  const isWeekend = dayIdx === 0 || dayIdx === 6;

                  return (
                    <div
                      key={dayIdx}
                      className={`min-h-[28px] border-l border-gray-100 p-0.5 space-y-0.5 ${
                        block
                          ? "bg-gray-200/70"
                          : isWeekend
                            ? "bg-gray-50/60"
                            : ""
                      }`}
                      style={
                        block
                          ? {
                              backgroundImage:
                                "repeating-linear-gradient(135deg, rgba(0,0,0,0.10) 0 5px, transparent 5px 10px)",
                            }
                          : undefined
                      }
                    >
                      {block && cellMeetings.length === 0 && (
                        <button
                          onClick={() => setSelectedBlock(block)}
                          title={`Unavailable — ${block.title}`}
                          className="w-full text-left px-1 text-[8px] font-black text-gray-600 truncate cursor-pointer"
                        >
                          {block.title}
                        </button>
                      )}
                      {cellMeetings.map((m) => {
                        const color = colorForManager(m.managerId);
                        const isRequest = m.status === "PENDING_CLIENT_REQUEST";
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelected(m)}
                            title={`${m.projectName} — ${m.clientName}`}
                            className={`w-full text-left px-1.5 py-0.5 rounded border ${color.bg} ${color.border} ${color.text} hover:brightness-95 transition-all cursor-pointer`}
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
            );
          })}
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
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-3 rounded border border-gray-300 bg-gray-200"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(0,0,0,0.10) 0 5px, transparent 5px 10px)",
            }}
          />
          Blocked off — clients cannot book
        </span>
        <span>Slots are {SLOT_MINUTES} minutes</span>
      </div>

      {/* Time-off list for the week on screen */}
      {blocks.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            Time off this week
          </h4>
          <div className="space-y-2">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {b.title}
                    {isPrivileged && b.user?.name && (
                      <span className="text-gray-400 font-normal">
                        {" "}
                        · {b.user.name}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {b.allDay
                      ? `${new Date(b.startAt).toLocaleDateString()} – ${new Date(b.endAt).toLocaleDateString()} (all day)`
                      : `${new Date(b.startAt).toLocaleString()} – ${new Date(b.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
                {/* The two actions are one group, so the row's
                    `justify-between` splits the space between the text and the
                    pair rather than between all three children — which left the
                    pencil stranded in the middle of the row. */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openBlockForEdit(b)}
                    title="Edit this time off"
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(b.id)}
                    disabled={isDeletingBlock}
                    title="Remove this time off"
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Block detail */}
      {selectedBlock && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedBlock.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Blocked off</p>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-2 text-sm">
              <p>
                <span className="text-gray-500">From: </span>
                {new Date(selectedBlock.startAt).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-500">To: </span>
                {new Date(selectedBlock.endAt).toLocaleString()}
              </p>
              {selectedBlock.notes && (
                <p className="text-gray-600 pt-1 border-t border-gray-100 mt-2">
                  {selectedBlock.notes}
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={() => handleDeleteBlock(selectedBlock.id)}
                disabled={isDeletingBlock}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Remove
              </button>
              <button
                onClick={() => setSelectedBlock(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting detail / confirm-reject */}
      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">
                  {selected.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selected.projectName}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-2 text-sm">
              <p>
                <span className="text-gray-500">When: </span>
                {formatWindow(selected)}
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
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRespond(selected, "accept")}
                    disabled={isResponding}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
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
