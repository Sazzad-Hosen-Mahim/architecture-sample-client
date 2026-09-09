import { ProjectRequest } from "@/redux/api/adminDashboard/proposalApi";
import { toExternalUrl } from "@/utils/externalUrl";
import {
  CalendarIcon,
  ClockIcon,
  SendIcon,
  Loader2,
  ExternalLink,
  AlertCircle,
  Check,
  X,
  Lock,
  Handshake,
  Rocket,
  // Layers, // PHASE PROGRESS MEETINGS DISABLED (2026-08-31)
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  useSendMeetingLinkMutation,
  useAttachMeetingLinkMutation,
  useDeleteMeetingMutation,
  useRespondToMeetingMutation,
  type MeetingType,
} from "@/redux/api/meetingApi";
import MeetingSlotPicker, {
  EMPTY_SLOT_SELECTION,
  toMeetingWindow,
  type SlotSelection,
} from "@/components/Common/MeetingSlotPicker";
import { toDateInputValue } from "@/utils/scheduleSlots";
// Per-phase meeting cards were removed from this tab — the architect sets every
// meeting outside the two below.
// import PhaseMeetingCards from "../PhaseMeetingCards";

type MeetingRequestTabProps = {
  project: ProjectRequest;
};

interface MeetingSection {
  type: Exclude<MeetingType, "GENERAL">;
  heading: string;
  blurb: string;
  icon: typeof Handshake;
  defaultTitle: (projectName: string) => string;
  /**
   * Client-initiated sections have no "Schedule" action — the studio responds
   * to what comes in rather than starting one. A phase call depends on a
   * completed, paid-for phase, which only the client's dashboard can pick.
   */
  clientInitiated?: boolean;
}

/**
 * The meetings this tab deals with. The studio schedules the first two;
 * per-phase progress calls arrive from the client and are answered here.
 */
const MEETING_SECTIONS: MeetingSection[] = [
  {
    type: "INITIAL_CONSULTATION",
    heading: "Initial Consultation Meeting",
    blurb:
      "Either the client or the architect can set this. Only times free on the assigned PM's master schedule can be selected.",
    icon: Handshake,
    defaultTitle: (p) => `Initial Consultation — ${p}`,
  },
  {
    type: "PROJECT_KICKOFF",
    heading: "Project Kick-off Meeting",
    blurb:
      "Always set by the architect. Confirm the time with the client before sending the request.",
    icon: Rocket,
    defaultTitle: (p) => `Project Kick-off — ${p}`,
  },
  // ── PHASE PROGRESS MEETINGS — TEMPORARILY DISABLED (2026-08-31) ──────────
  // Only the two meetings above are in use for now. Re-enable by uncommenting
  // this section (backend phase-meeting logic must be restored too).
  // {
  //     type: "PHASE_PROGRESS",
  //     heading: "Phase Progress Meetings",
  //     blurb:
  //         "Requested by the client once a phase is complete and paid for. Accept the time, then send the joining link.",
  //     icon: Layers,
  //     defaultTitle: (p) => `Phase Progress — ${p}`,
  //     clientInitiated: true,
  // },
];

export default function MeetingRequestTab({ project }: MeetingRequestTabProps) {
  const meetingFormRef = useRef<HTMLDivElement>(null);
  const meetingUrlInputRef = useRef<HTMLInputElement>(null);
  const [sendMeetingLink, { isLoading: isSendingMeeting }] =
    useSendMeetingLinkMutation();
  const [attachMeetingLink, { isLoading: isAttaching }] =
    useAttachMeetingLinkMutation();
  const [respondToMeeting, { isLoading: isResponding }] =
    useRespondToMeetingMutation();
  const [deleteMeeting, { isLoading: isDeleting }] = useDeleteMeetingMutation();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  // Deleting is irreversible, so the trash icon arms a confirm on the card
  // rather than firing straight away.
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [meetingForm, setMeetingForm] = useState({
    meetingUrl: "",
    title: "",
    notes: "",
    meetingType: "INITIAL_CONSULTATION" as MeetingType,
  });
  const [slot, setSlot] = useState<SlotSelection>(EMPTY_SLOT_SELECTION);

  /**
   * When set, the form is finishing off a meeting that already exists — the
   * time was agreed with the client and only the joining link is missing.
   * Submitting updates that booking in place instead of creating a second one
   * on the same slot (which the calendar would rightly reject).
   */
  const [linkingMeeting, setLinkingMeeting] = useState<any | null>(null);
  const isBusy = isSendingMeeting || isAttaching;

  const resetForm = () => {
    setMeetingForm({
      meetingUrl: "",
      title: "",
      notes: "",
      meetingType: "INITIAL_CONSULTATION",
    });
    setSlot(EMPTY_SLOT_SELECTION);
    setLinkingMeeting(null);
  };

  useEffect(() => {
    if (project) resetForm();
  }, [project]);

  const handleSendMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();

    const window = toMeetingWindow(slot);

    if (!meetingForm.meetingUrl || !meetingForm.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (linkingMeeting) {
        // Keep the agreed slot unless the PM actively picked a new one.
        const retimed =
          window &&
          window.scheduledAt !==
            new Date(linkingMeeting.scheduledAt).toISOString();

        const res: any = await attachMeetingLink({
          meetingId: linkingMeeting.id,
          meetingUrl: meetingForm.meetingUrl,
          title: meetingForm.title,
          notes: meetingForm.notes,
          ...(retimed ? window : {}),
        }).unwrap();
        toast.success(res?.message || "Meeting link sent!");
      } else {
        if (!window) {
          toast.error("Please pick a time slot");
          return;
        }
        await sendMeetingLink({
          projectRequestId: project.id,
          meetingUrl: meetingForm.meetingUrl,
          title: meetingForm.title,
          notes: meetingForm.notes,
          meetingType: meetingForm.meetingType,
          ...window,
        }).unwrap();
        toast.success("Meeting link sent successfully!");
      }
      resetForm();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          "Failed to send meeting link. Please try again.",
      );
    }
  };

  /**
   * Load the form to finish off an existing meeting: same time, same title,
   * just needs the link.
   */
  const startLinking = (meeting: any) => {
    setLinkingMeeting(meeting);
    setMeetingForm({
      meetingUrl: meeting.meetingUrl || "",
      title: meeting.title?.includes("Requested by Client")
        ? `Initial Consultation — ${project.projectName}`
        : meeting.title || `Meeting for ${project.projectName}`,
      notes: meeting.notes || "",
      meetingType: meeting.meetingType || "INITIAL_CONSULTATION",
    });

    const start = new Date(meeting.scheduledAt);
    const end = meeting.endsAt ? new Date(meeting.endsAt) : null;
    setSlot({
      date: toDateInputValue(start),
      startMinutes: start.getHours() * 60 + start.getMinutes(),
      endMinutes: end ? end.getHours() * 60 + end.getMinutes() : null,
    });

    meetingFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setTimeout(() => meetingUrlInputRef.current?.focus(), 500);
  };

  const handleMeetingFormChange = (field: string, value: string) => {
    setMeetingForm((prev) => ({ ...prev, [field]: value }));
  };

  /** Load the form for a brand-new meeting of a given type. */
  const startScheduling = (type: MeetingType) => {
    const section = MEETING_SECTIONS.find((s) => s.type === type);
    setLinkingMeeting(null);
    setMeetingForm({
      meetingUrl: "",
      title:
        section?.defaultTitle(project.projectName) ??
        `Meeting for ${project.projectName}`,
      notes: "",
      meetingType: type,
    });
    setSlot(EMPTY_SLOT_SELECTION);

    meetingFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setTimeout(() => meetingUrlInputRef.current?.focus(), 500);
  };

  const handleAcceptRequest = async (meeting: any) => {
    setRespondingId(meeting.id);
    try {
      await respondToMeeting({
        meetingId: meeting.id,
        action: "accept",
      }).unwrap();
      toast.success("Time confirmed. Now add the joining link below.");
      // Continue with *this* booking rather than opening a blank form —
      // the slot is now reserved, so a second meeting on it would clash.
      startLinking(meeting);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to accept request");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeleteMeeting = async (meeting: any) => {
    setDeletingId(meeting.id);
    try {
      await deleteMeeting(meeting.id).unwrap();
      toast.success("Meeting removed.");
      setDeleteConfirmId(null);
      // The form may have been loaded from the row that just disappeared.
      if (linkingMeeting?.id === meeting.id) resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove meeting");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRejectRequest = async (meeting: any) => {
    setRespondingId(meeting.id);
    try {
      await respondToMeeting({
        meetingId: meeting.id,
        action: "reject",
      }).unwrap();
      toast.success("Request declined. You can propose a new time below.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to decline request");
    } finally {
      setRespondingId(null);
    }
  };

  const allMeetings: any[] = project.meetingLinks || [];
  const pendingRequests = allMeetings.filter(
    (m) => m.status === "PENDING_CLIENT_REQUEST",
  );

  /**
   * Meetings that belong to a section. Rows created before meeting types
   * existed carry no type — they're shown under the initial consultation so
   * nothing disappears from the history.
   */
  const meetingsFor = (type: MeetingType) =>
    allMeetings.filter((m) => {
      // Either signal marks a phase call: the stage link, or the stored
      // type. Both are checked because older rows carry no type, and some
      // payloads omit `stageId` — keying off only one silently loses the
      // meeting from every box.
      const isPhase = Boolean(m.stageId) || m.meetingType === "PHASE_PROGRESS";
      if (isPhase) return type === "PHASE_PROGRESS";
      if (type === "PHASE_PROGRESS") return false;

      return type === "INITIAL_CONSULTATION"
        ? !m.meetingType ||
            m.meetingType === "INITIAL_CONSULTATION" ||
            m.meetingType === "GENERAL"
        : m.meetingType === type;
    });

  /** Which phase a progress meeting is about, for the card's badge. */
  const stageNameFor = (meeting: any): string | null => {
    if (!meeting.stageId) return null;
    const stage = (project as any).stages?.find(
      (s: any) => s.id === meeting.stageId,
    );
    return stage?.name ?? null;
  };

  const formatWindow = (meeting: any) => {
    const start = new Date(meeting.scheduledAt);
    const time = start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!meeting.endsAt) return time;
    const end = new Date(meeting.endsAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${time} – ${end}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CLIENT_REQUEST":
        return (
          <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-amber-200">
            Client Requested
          </span>
        );
      case "PENDING_RESPONSE":
        return (
          <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-blue-200">
            Awaiting Client
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-green-200 inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            Confirmed
          </span>
        );
      case "DECLINED":
        return (
          <span className="text-[10px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-red-200">
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  const renderMeetingCard = (meeting: any) => {
    const isClientRequest = meeting.status === "PENDING_CLIENT_REQUEST";
    const isAccepted = meeting.status === "ACCEPTED";
    // A declined time was never agreed, so there is nothing to send a link
    // for. The sender re-proposes a new time instead.
    const isDeclined = meeting.status === "DECLINED";
    const isThisResponding = isResponding && respondingId === meeting.id;
    const isConfirmingDelete = deleteConfirmId === meeting.id;
    const isThisDeleting = isDeleting && deletingId === meeting.id;

    return (
      <div
        key={meeting.id}
        className={`p-4 rounded-xl border transition-all ${
          isClientRequest
            ? "bg-amber-50/50 border-amber-100 shadow-sm"
            : isAccepted
              ? "bg-green-50/40 border-green-100"
              : isDeclined
                ? "bg-red-50/30 border-red-100"
                : "bg-gray-50 border-gray-100"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900">
                {meeting.title}
              </h4>
              {getStatusBadge(meeting.status)}
              {stageNameFor(meeting) && (
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-indigo-200">
                  {stageNameFor(meeting)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {new Date(meeting.scheduledAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatWindow(meeting)}
              </span>
            </div>
            {meeting.notes && (
              <p className="text-xs text-gray-500 mt-2 italic bg-white/50 p-2 rounded border border-gray-100">
                &ldquo;{meeting.notes}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isClientRequest ? (
              <>
                <button
                  onClick={() => handleAcceptRequest(meeting)}
                  disabled={isThisResponding}
                  className="inline-flex items-center justify-center w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
                  title="Accept requested date"
                >
                  {isThisResponding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleRejectRequest(meeting)}
                  disabled={isThisResponding}
                  className="inline-flex items-center justify-center w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Decline requested date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : meeting.meetingUrl ? (
              <a
                href={toExternalUrl(meeting.meetingUrl) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-blue-600 shadow-sm transition-all active:scale-95"
                title="Open Meeting Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : isDeclined ? null : (
              // Time agreed but no joining link yet — the remaining
              // half of the flow, done against this same booking.
              <button
                onClick={() => startLinking(meeting)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
                title="Add the joining link for this meeting"
              >
                <LinkIcon className="w-3 h-3" />
                Send Link
              </button>
            )}

            {/* Clear the meeting out of the workflow entirely. */}
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDeleteMeeting(meeting)}
                  disabled={isThisDeleting}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Permanently delete this meeting"
                >
                  {isThisDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isThisDeleting}
                  className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(meeting.id)}
                className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95 cursor-pointer"
                title="Delete this meeting"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const activeSection = MEETING_SECTIONS.find(
    (s) => s.type === meetingForm.meetingType,
  );

  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Meetings & Requests
          </h2>
          <p className="text-sm text-gray-500">
            Schedule the consultation and kick-off calls against the assigned
            manager's master schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {allMeetings.length} Total
          </span>
          {pendingRequests.length > 0 && (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {pendingRequests.length} Pending
            </span>
          )}
        </div>
      </div>

      {/* Alert for Pending Meeting Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">
              New Meeting Request(s)
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              The client has requested a meeting. Accept or decline the
              requested date below.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The two meetings the studio schedules */}
        <div className="space-y-4">
          {MEETING_SECTIONS.map((section) => {
            const Icon = section.icon;
            const meetings = meetingsFor(section.type);
            const confirmed = meetings.find((m) => m.status === "ACCEPTED");

            return (
              <div
                key={section.type}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      {section.heading}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {section.blurb}
                    </p>
                  </div>
                  {section.clientInitiated ? (
                    meetings.length > 0 && (
                      <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-gray-200 whitespace-nowrap">
                        {meetings.length} Request
                        {meetings.length === 1 ? "" : "s"}
                      </span>
                    )
                  ) : confirmed ? (
                    <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-green-200 whitespace-nowrap">
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => startScheduling(section.type)}
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap cursor-pointer"
                    >
                      Schedule
                    </button>
                  )}
                </div>

                <div className="p-3 space-y-3">
                  {meetings.length > 0 ? (
                    meetings.map(renderMeetingCard)
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-xs text-gray-500">
                        {section.clientInitiated
                          ? "No phase meetings requested yet"
                          : `No ${section.heading.toLowerCase()} scheduled yet`}
                      </p>
                      {!section.clientInitiated && (
                        <button
                          onClick={() => startScheduling(section.type)}
                          className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                          Schedule one
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule/Fix Form Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
            <SendIcon className="w-4 h-4" />
            Fix / Schedule Meeting
          </h3>

          <div
            ref={meetingFormRef}
            className="border border-blue-200 bg-blue-50 rounded-xl p-6 shadow-sm"
          >
            {linkingMeeting ? (
              <div className="mb-5 p-3 rounded-lg bg-white border border-blue-200">
                <p className="text-xs font-semibold text-blue-800">
                  Adding the link to an agreed meeting
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  {new Date(linkingMeeting.scheduledAt).toLocaleDateString()} ·{" "}
                  {formatWindow(linkingMeeting)}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  The time is already confirmed with the client — just add the
                  joining link. Changing the time below will ask them to confirm
                  again.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 text-[11px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel and schedule a new meeting instead
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">
                  Enter the meeting details below to send a link to the client.
                </p>
                <p className="text-xs font-semibold text-blue-800 mb-5">
                  Scheduling: {activeSection?.heading ?? "Meeting"}
                </p>
              </>
            )}

            <form onSubmit={handleSendMeetingLink} className="space-y-4">
              {!linkingMeeting && (
                <div>
                  <label
                    htmlFor="meetingType"
                    className="block text-sm font-semibold text-gray-900 mb-1"
                  >
                    Meeting Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="meetingType"
                    value={meetingForm.meetingType}
                    onChange={(e) =>
                      startScheduling(e.target.value as MeetingType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    disabled={isBusy}
                  >
                    {/* Phase calls are client-initiated, so they
                                            are not offered as something to start here. */}
                    {MEETING_SECTIONS.filter((s) => !s.clientInitiated).map(
                      (s) => (
                        <option key={s.type} value={s.type}>
                          {s.heading}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="meetingUrl"
                  className="block text-sm font-semibold text-gray-900 mb-1"
                >
                  Meeting URL <span className="text-red-500">*</span>
                </label>
                <input
                  ref={meetingUrlInputRef}
                  type="url"
                  id="meetingUrl"
                  value={meetingForm.meetingUrl}
                  onChange={(e) =>
                    handleMeetingFormChange("meetingUrl", e.target.value)
                  }
                  placeholder="Meeting Link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                  disabled={isBusy}
                />
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-900 mb-1"
                >
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={meetingForm.title}
                  onChange={(e) =>
                    handleMeetingFormChange("title", e.target.value)
                  }
                  placeholder="Meeting for Architecture Design"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                  disabled={isBusy}
                />
              </div>

              {/* 30-minute grid off the assigned manager's master schedule.
                                Times they've already booked or blocked are unselectable.
                                When finishing an existing meeting, that booking is excluded
                                so its own slot stays selectable. */}
              <MeetingSlotPicker
                value={slot}
                onChange={setSlot}
                projectRequestId={project.id}
                excludeMeetingId={linkingMeeting?.id}
                disabled={isBusy}
                accent="blue"
              />

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold text-gray-900 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={meetingForm.notes}
                  onChange={(e) =>
                    handleMeetingFormChange("notes", e.target.value)
                  }
                  placeholder="Please have your project documents ready."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  disabled={isBusy}
                />
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="w-4 h-4 mr-2" />
                    Send Meeting Link
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
