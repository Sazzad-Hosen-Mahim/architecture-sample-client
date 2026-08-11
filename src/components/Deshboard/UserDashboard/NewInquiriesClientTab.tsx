import { useGetMyNewInquiriesQuery, useAttachConsultationPaymentMutation, NewInquiry } from "@/redux/api/newInquiryApi";
import { toExternalUrl } from "@/utils/externalUrl";
import { useCreateConsultationIntentMutation } from "@/redux/api/paymentApi";
import {
    Loader2,
    LayoutList,
    MoreHorizontal,
    Calendar,
    ExternalLink,
    FileText,
    Clock,
    CreditCard,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeConsultationForm from "@/components/New project/StripeConsultationForm";
import { toast } from "sonner";

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

interface NewInquiriesClientTabProps {
    searchQuery?: string;
}

const NewInquiriesClientTab = ({ searchQuery = "" }: NewInquiriesClientTabProps) => {
    const { data: response, isLoading } = useGetMyNewInquiriesQuery();
    const inquiries = response?.data || [];
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<NewInquiry | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Consultation fee payment (for PM-created inquiries not yet paid)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [payingInquiry, setPayingInquiry] = useState<NewInquiry | null>(null);
    const [clientSecret, setClientSecret] = useState("");
    const [createIntent, { isLoading: isCreatingIntent }] = useCreateConsultationIntentMutation();
    const [attachPayment] = useAttachConsultationPaymentMutation();

    const openPaymentModal = async (inquiry: NewInquiry) => {
        setPayingInquiry(inquiry);
        setClientSecret("");
        setPaymentModalOpen(true);
        try {
            const result = await createIntent({}).unwrap();
            setClientSecret(result.data.clientSecret);
        } catch {
            toast.error("Failed to initialize payment. Please try again.");
        }
    };

    const handlePaymentSuccess = async (paymentIntentId: string) => {
        if (!payingInquiry) return;
        try {
            await attachPayment({ projectRequestId: payingInquiry.id, paymentIntentId }).unwrap();
            toast.success("Consultation fee paid! You can now request a meeting.");
            setPaymentModalOpen(false);
            setPayingInquiry(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Payment succeeded but could not be confirmed. Please contact support.");
        }
    };

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

    const filteredInquiries = inquiries.filter((inquiry: NewInquiry) =>
        inquiry.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (`${inquiry.clientFirstName} ${inquiry.clientLastName}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-500 animate-pulse">Fetching your inquiries...</p>
            </div>
        );
    }

    if (filteredInquiries.length === 0) {
        return (
            <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No inquiries found</p>
                <p className="text-xs text-gray-400 mt-1">
                    When a project manager sends you an inquiry, it will appear here.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-[750px] w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold">Project Name</th>
                            <th className="px-6 py-4 text-left font-semibold">Service Type</th>
                            <th className="px-6 py-4 text-left font-semibold">Budget</th>
                            <th className="px-6 py-4 text-center font-semibold">Status</th>
                            <th className="px-6 py-4 text-left font-semibold">Date</th>
                            <th className="px-6 py-4 text-left font-semibold">Proposal</th>
                            <th className="px-6 py-4 text-right font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredInquiries.map((inquiry: NewInquiry) => {
                            const latestProposal = inquiry.proposals && inquiry.proposals.length > 0
                                ? inquiry.proposals[0]
                                : null;
                            const latestMeeting = inquiry.meetingLinks && inquiry.meetingLinks.length > 0
                                ? inquiry.meetingLinks[0]
                                : null;

                            return (
                                <tr key={inquiry.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{inquiry.projectName}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5 font-mono">
                                            ID: {inquiry.id.split('-')[0]}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                                            {(inquiry.serviceType || "").replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
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
                                                <FileText className="w-3.5 h-3.5 text-blue-500" />
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
                                            <span className="text-xs text-gray-400 italic">No proposal yet</span>
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
                                                    {!inquiry.consultationPaymentId ? (
                                                        <button
                                                            onClick={() => {
                                                                openPaymentModal(inquiry);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <CreditCard className="w-4 h-4 text-amber-500" />
                                                            Pay Consultation Fee
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInquiry(inquiry);
                                                                setMeetingModalOpen(true);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Calendar className="w-4 h-4 text-blue-500" />
                                                            Set a Meeting
                                                        </button>
                                                    )}

                                                    {latestMeeting && (
                                                        <a
                                                            href={toExternalUrl(latestMeeting.meetingUrl) ?? undefined}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-green-500" />
                                                            Join Meeting
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

            {/* Meeting Info / Upcoming Meetings Section */}
            {filteredInquiries.some((i: NewInquiry) => i.meetingLinks && i.meetingLinks.length > 0) && (
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Upcoming Meetings
                    </h3>
                    <div className="space-y-2">
                        {filteredInquiries
                            .filter((i: NewInquiry) => i.meetingLinks && i.meetingLinks.length > 0)
                            .map((inquiry: NewInquiry) =>
                                inquiry.meetingLinks?.map((meeting) => (
                                    <div key={meeting.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-blue-100">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{meeting.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {inquiry.projectName} • {formatDate(meeting.scheduledAt)}
                                            </p>
                                        </div>
                                        <a
                                            href={toExternalUrl(meeting.meetingUrl) ?? undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            JOIN
                                        </a>
                                    </div>
                                ))
                            )}
                    </div>
                </div>
            )}

            {/* Meeting Request Modal (simplified - just shows info) */}
            {meetingModalOpen && selectedInquiry && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="bg-blue-600 px-6 py-5 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Meeting Request
                            </h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <p className="text-sm text-blue-800 font-medium mb-1">{selectedInquiry.projectName}</p>
                                <p className="text-xs text-blue-600">
                                    Service: {(selectedInquiry.serviceType || "").replace(/_/g, " ")}
                                </p>
                            </div>

                            {selectedInquiry.meetingLinks && selectedInquiry.meetingLinks.length > 0 ? (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Scheduled Meetings:</p>
                                    {selectedInquiry.meetingLinks.map((meeting) => (
                                        <div key={meeting.id} className="bg-gray-50 rounded-lg p-3 border mb-2">
                                            <p className="text-sm font-medium">{meeting.title}</p>
                                            <p className="text-xs text-gray-500">{formatDate(meeting.scheduledAt)}</p>
                                            <a
                                                href={toExternalUrl(meeting.meetingUrl) ?? undefined}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline mt-1 block"
                                            >
                                                Join Meeting →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-4">
                                    <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm">No meetings scheduled yet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        The project manager will send you a meeting link soon.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end">
                            <button
                                onClick={() => {
                                    setMeetingModalOpen(false);
                                    setSelectedInquiry(null);
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Consultation Fee Payment Modal */}
            {paymentModalOpen && payingInquiry && (
                <div className="fixed inset-0 h-[50%] backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="bg-amber-600 px-6 py-5 rounded-t-xl flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Pay Consultation Fee
                            </h3>
                            <button
                                onClick={() => {
                                    setPaymentModalOpen(false);
                                    setPayingInquiry(null);
                                }}
                                className="text-white/80 hover:text-white text-xl leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-gray-600">
                                Please pay the consultation fee for <strong>{payingInquiry.projectName}</strong> before
                                requesting a meeting.
                            </p>
                            {clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <StripeConsultationForm
                                        onSuccess={handlePaymentSuccess}
                                        clientEmail={payingInquiry.email}
                                    />
                                </Elements>
                            ) : isCreatingIntent ? (
                                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-slate-50">
                                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
                                    <p className="text-sm text-slate-600">Initializing secure payment...</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-100">
                                    Please wait, initializing payment gateway...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NewInquiriesClientTab;
