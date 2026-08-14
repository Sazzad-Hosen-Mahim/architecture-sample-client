import { useGetAllNewInquiriesQuery, NewInquiry } from "@/redux/api/newInquiryApi";
import { toExternalUrl } from "@/utils/externalUrl";
import { useSendMeetingLinkMutation } from "@/redux/api/meetingApi";
import {
    Loader2,
    LayoutList,
    MoreHorizontal,
    Send,
    Calendar,
    ExternalLink,
    Mail,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MeetingSlotPicker, {
    EMPTY_SLOT_SELECTION,
    toMeetingWindow,
    type SlotSelection,
} from "@/components/Common/MeetingSlotPicker";

const NewInquiriesPMTab = () => {
    const { data: response, isLoading } = useGetAllNewInquiriesQuery();
    const [sendMeetingLink, { isLoading: isSendingMeeting }] = useSendMeetingLinkMutation();
    const navigate = useNavigate();
    const inquiries = response?.data || [];
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<NewInquiry | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Meeting form state
    const [meetingForm, setMeetingForm] = useState({
        title: "",
        meetingUrl: "",
        notes: "",
    });
    // Booked against the assigned manager's master schedule, on the shared
    // 30-minute grid.
    const [slot, setSlot] = useState<SlotSelection>(EMPTY_SLOT_SELECTION);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadgeClass = (status: string) => {
        const configs: Record<string, string> = {
            PENDING: "bg-amber-100 text-amber-700 border-amber-200",
            REVIEWED: "bg-purple-100 text-purple-700 border-purple-200",
            SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
            ACTIVE: "bg-green-100 text-green-700 border-green-200",
            COMPLETED: "bg-teal-100 text-teal-700 border-teal-200",
            CANCELLED: "bg-red-100 text-red-700 border-red-200",
        };
        return configs[status] || "bg-gray-100 text-gray-700 border-gray-200";
    };

    const handleSendProposal = (inquiry: NewInquiry) => {
        // Navigate to the existing new proposal page (which uses the same project request flow)
        // Pass the project request ID so the proposal can be linked
        navigate(`/dashboard/new-proposal?projectRequestId=${inquiry.id}`);
    };

    const handleSendMeeting = async () => {
        if (!selectedInquiry) return;

        const window = toMeetingWindow(slot);
        if (!meetingForm.title || !meetingForm.meetingUrl || !window) {
            toast.error("Please fill in all required fields and pick a time slot");
            return;
        }

        try {
            await sendMeetingLink({
                projectRequestId: selectedInquiry.id,
                title: meetingForm.title,
                meetingUrl: meetingForm.meetingUrl,
                notes: meetingForm.notes || "",
                meetingType: "INITIAL_CONSULTATION",
                ...window,
            }).unwrap();

            toast.success("Meeting link sent successfully!");
            setMeetingModalOpen(false);
            setSelectedInquiry(null);
            setMeetingForm({ title: "", meetingUrl: "", notes: "" });
            setSlot(EMPTY_SLOT_SELECTION);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to send meeting link");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-500 animate-pulse">Loading new inquiries...</p>
            </div>
        );
    }

    if (inquiries.length === 0) {
        return (
            <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No new inquiries yet</p>
                <p className="text-xs text-gray-400 mt-1">
                    Create a new inquiry to get started.
                </p>
                <Button
                    onClick={() => navigate("/dashboard/new-inquiries")}
                    className="mt-4 bg-gray-800 text-white hover:bg-black cursor-pointer"
                >
                    Create New Inquiry
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">New Inquiries</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{inquiries.length} total</span>
                        <Button
                            onClick={() => navigate("/dashboard/new-inquiries")}
                            className="bg-gray-800 text-white hover:bg-black cursor-pointer text-xs"
                        >
                            + New Inquiry
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Client</th>
                                <th className="px-6 py-4 text-left font-semibold">Project</th>
                                <th className="px-6 py-4 text-left font-semibold">Service</th>
                                <th className="px-6 py-4 text-left font-semibold">Budget</th>
                                <th className="px-6 py-4 text-center font-semibold">Status</th>
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 text-left font-semibold">Proposal</th>
                                <th className="px-6 py-4 text-right font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inquiries.map((inquiry: NewInquiry) => {
                                const latestProposal = inquiry.proposals && inquiry.proposals.length > 0
                                    ? inquiry.proposals[0]
                                    : null;
                                const latestMeeting = inquiry.meetingLinks && inquiry.meetingLinks.length > 0
                                    ? inquiry.meetingLinks[0]
                                    : null;

                                return (
                                    <tr key={inquiry.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">
                                                {inquiry.clientFirstName} {inquiry.clientLastName}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Mail className="w-3 h-3" />
                                                {inquiry.email}
                                            </div>
                                            {inquiry.companyName && (
                                                <div className="text-[10px] text-gray-400">{inquiry.companyName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{inquiry.projectName}</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5 font-mono">
                                                ID: {inquiry.id.split('-')[0]}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                                                {(inquiry.serviceType || "").replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-xs">
                                            {inquiry.budgetRange || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border uppercase tracking-tight ${getStatusBadgeClass(inquiry.status)}`}>
                                                {inquiry.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-xs">
                                            {formatDate(inquiry.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {latestProposal ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-blue-700 font-medium">
                                                        {latestProposal.proposalNumber}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${latestProposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                                        latestProposal.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {latestProposal.status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <div ref={openDropdownId === inquiry.id ? dropdownRef : null}>
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === inquiry.id ? null : inquiry.id)}
                                                    className="inline-flex items-center p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                </button>

                                                {openDropdownId === inquiry.id && (
                                                    <div className="absolute right-6 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                                                        <button
                                                            onClick={() => {
                                                                handleSendProposal(inquiry);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors cursor-pointer"
                                                        >
                                                            <Send className="w-4 h-4 text-blue-500" />
                                                            Send a Proposal
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInquiry(inquiry);
                                                                setMeetingModalOpen(true);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                        >
                                                            <Calendar className="w-4 h-4 text-green-500" />
                                                            Schedule Meeting
                                                        </button>
                                                        {latestMeeting && (
                                                            <a
                                                                href={toExternalUrl(latestMeeting.meetingUrl) ?? undefined}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                                                            >
                                                                <ExternalLink className="w-4 h-4 text-purple-500" />
                                                                Join Latest Meeting
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Send Meeting Modal */}
            {meetingModalOpen && selectedInquiry && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="bg-green-600 px-6 py-5 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Schedule Meeting
                            </h3>
                            <p className="text-green-100 text-sm mt-1">
                                For: {selectedInquiry.clientFirstName} {selectedInquiry.clientLastName} — {selectedInquiry.projectName}
                            </p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <Label htmlFor="meetingTitle" className="mb-2 block text-sm font-medium">
                                    Meeting Title *
                                </Label>
                                <Input
                                    id="meetingTitle"
                                    value={meetingForm.title}
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Initial Consultation"
                                />
                            </div>
                            <div>
                                <Label htmlFor="meetingUrl" className="mb-2 block text-sm font-medium">
                                    Meeting URL *
                                </Label>
                                <Input
                                    id="meetingUrl"
                                    value={meetingForm.meetingUrl}
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                            <MeetingSlotPicker
                                value={slot}
                                onChange={setSlot}
                                projectRequestId={selectedInquiry.id}
                                disabled={isSendingMeeting}
                                accent="emerald"
                            />
                            <div>
                                <Label htmlFor="meetingNotes" className="mb-2 block text-sm font-medium">
                                    Notes (optional)
                                </Label>
                                <Input
                                    id="meetingNotes"
                                    value={meetingForm.notes}
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setMeetingModalOpen(false);
                                    setSelectedInquiry(null);
                                }}
                                disabled={isSendingMeeting}
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendMeeting}
                                disabled={isSendingMeeting}
                                className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                            >
                                {isSendingMeeting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Meeting Link"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NewInquiriesPMTab;
