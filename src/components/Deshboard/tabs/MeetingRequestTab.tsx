import { ProjectRequest } from "@/redux/api/adminDashboard/proposalApi";
import { toExternalUrl } from "@/utils/externalUrl";
import {
    CalendarIcon,
    ClockIcon,
    VideoIcon,
    SendIcon,
    Loader2,
    ExternalLink,
    AlertCircle,
    Check,
    X,
    Lock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSendMeetingLinkMutation, useRespondToMeetingMutation } from "@/redux/api/meetingApi";
import PhaseMeetingCards from "../PhaseMeetingCards";

type MeetingRequestTabProps = {
    project: ProjectRequest;
};

export default function MeetingRequestTab({ project }: MeetingRequestTabProps) {
    const meetingFormRef = useRef<HTMLDivElement>(null);
    const meetingUrlInputRef = useRef<HTMLInputElement>(null);
    const [sendMeetingLink, { isLoading: isSendingMeeting }] = useSendMeetingLinkMutation();
    const [respondToMeeting, { isLoading: isResponding }] = useRespondToMeetingMutation();
    const [respondingId, setRespondingId] = useState<string | null>(null);

    const [meetingForm, setMeetingForm] = useState({
        meetingUrl: "",
        title: "",
        scheduledAt: "",
        notes: "",
    });

    useEffect(() => {
        if (project) {
            setMeetingForm({
                meetingUrl: "",
                title: "",
                scheduledAt: "",
                notes: "",
            });
        }
    }, [project]);

    const handleSendMeetingLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meetingForm.meetingUrl || !meetingForm.title || !meetingForm.scheduledAt) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            await sendMeetingLink({
                projectRequestId: project.id,
                ...meetingForm,
            }).unwrap();
            toast.success("Meeting link sent successfully!");
            setMeetingForm({ meetingUrl: "", title: "", scheduledAt: "", notes: "" });
        } catch (error) {
            console.error("Failed to send meeting link:", error);
            toast.error("Failed to send meeting link. Please try again.");
        }
    };

    const handleMeetingFormChange = (field: string, value: string) => {
        setMeetingForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleRespondToRequest = (meeting: any) => {
        setMeetingForm({
            meetingUrl: "",
            title: `Meeting for ${project.projectName}`,
            scheduledAt: new Date(meeting.scheduledAt).toISOString().slice(0, 16),
            notes: `Responding to your request: ${meeting.notes || 'No notes provided'}`,
        });

        // Scroll to form and focus
        meetingFormRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            meetingUrlInputRef.current?.focus();
        }, 800);
    };

    const handleAcceptRequest = async (meeting: any) => {
        setRespondingId(meeting.id);
        try {
            await respondToMeeting({ meetingId: meeting.id, action: "accept" }).unwrap();
            toast.success("Request accepted. Now send the meeting link below.");
            handleRespondToRequest(meeting);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to accept request");
        } finally {
            setRespondingId(null);
        }
    };

    const handleRejectRequest = async (meeting: any) => {
        setRespondingId(meeting.id);
        try {
            await respondToMeeting({ meetingId: meeting.id, action: "reject" }).unwrap();
            toast.success("Request declined. You can propose a new time below.");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to decline request");
        } finally {
            setRespondingId(null);
        }
    };

    // Meetings logic
    const pendingRequests = project.meetingLinks?.filter(m => (m as any).status === "PENDING_CLIENT_REQUEST") || [];

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

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Meetings & Requests</h2>
                    <p className="text-sm text-gray-500">Manage meeting requests and schedule consultations with the client</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {project.meetingLinks?.length || 0} Total
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
                        <h4 className="text-sm font-bold text-amber-900">New Meeting Request(s)</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            The client has requested a meeting. Accept or decline the requested date below.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Requests Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <VideoIcon className="w-4 h-4" />
                        Meeting History & Requests
                    </h3>

                    <div className="space-y-3">
                        {project.meetingLinks && project.meetingLinks.length > 0 ? (
                            project.meetingLinks.map((meeting: any) => {
                                const isClientRequest = meeting.status === "PENDING_CLIENT_REQUEST";
                                const isAccepted = meeting.status === "ACCEPTED";
                                const isThisResponding = isResponding && respondingId === meeting.id;
                                return (
                                    <div key={meeting.id} className={`p-4 rounded-xl border transition-all ${isClientRequest ? 'bg-amber-50/50 border-amber-100 shadow-sm' : isAccepted ? 'bg-green-50/40 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-gray-900">{meeting.title}</h4>
                                                    {getStatusBadge(meeting.status)}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        {new Date(meeting.scheduledAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {meeting.notes && (
                                                    <p className="text-xs text-gray-500 mt-2 italic bg-white/50 p-2 rounded border border-gray-100">
                                                        &ldquo;{meeting.notes}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                            {isClientRequest ? (
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleAcceptRequest(meeting)}
                                                        disabled={isThisResponding}
                                                        className="inline-flex items-center justify-center w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                                        title="Accept requested date"
                                                    >
                                                        {isThisResponding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(meeting)}
                                                        disabled={isThisResponding}
                                                        className="inline-flex items-center justify-center w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                        title="Decline requested date"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
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
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <VideoIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No meetings scheduled yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Schedule/Fix Form Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <SendIcon className="w-4 h-4" />
                        Fix / Schedule Meeting
                    </h3>

                    <div ref={meetingFormRef} className="border border-blue-200 bg-blue-50 rounded-xl p-6 shadow-sm">
                        <p className="text-sm text-gray-600 mb-6">
                            Enter the meeting details below to send a link to the client.
                        </p>
                        <form onSubmit={handleSendMeetingLink} className="space-y-4">
                            <div>
                                <label htmlFor="meetingUrl" className="block text-sm font-semibold text-gray-900 mb-1">
                                    Meeting URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={meetingUrlInputRef}
                                    type="url"
                                    id="meetingUrl"
                                    value={meetingForm.meetingUrl}
                                    onChange={(e) => handleMeetingFormChange("meetingUrl", e.target.value)}
                                    placeholder="Meeting Link"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                    disabled={isSendingMeeting}
                                />
                            </div>
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-1">
                                    Meeting Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={meetingForm.title}
                                    onChange={(e) => handleMeetingFormChange("title", e.target.value)}
                                    placeholder="Meeting for Architecture Design"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                    disabled={isSendingMeeting}
                                />
                            </div>
                            <div>
                                <label htmlFor="scheduledAt" className="block text-sm font-semibold text-gray-900 mb-1">
                                    Scheduled Date & Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    id="scheduledAt"
                                    value={meetingForm.scheduledAt}
                                    onChange={(e) => handleMeetingFormChange("scheduledAt", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                    disabled={isSendingMeeting}
                                />
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-1">Notes</label>
                                <textarea
                                    id="notes"
                                    value={meetingForm.notes}
                                    onChange={(e) => handleMeetingFormChange("notes", e.target.value)}
                                    placeholder="Please have your project documents ready."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                                    disabled={isSendingMeeting}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSendingMeeting}
                                className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {isSendingMeeting ? (
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

            {/* Per-phase meeting cards — appear once a proposal is accepted */}
            <PhaseMeetingCards project={project} />
        </div>
    );
}
