import { useMemo, useState } from "react";
import {
    CalendarPlus,
    VideoIcon,
    Calendar,
    Clock,
    CheckCircle2,
    ExternalLink,
    X,
    Loader2,
    DollarSign,
    Lock,
    SkipForward,
    CreditCard,
    FileText,
    RefreshCcw,
} from "lucide-react";
import { isLumpSum, paymentPlanLabel, paymentPlanDescription } from "@/utils/paymentPlan";
import { toExternalUrl } from "@/utils/externalUrl";
import { toast } from "sonner";
import {
    useRequestMeetingMutation,
    useRespondToMeetingMutation,
    useBypassPhaseMeetingMutation,
} from "@/redux/api/meetingApi";
import RequestMeetingModal from "../RequestMeetingModal";
import ConsultationFeeModal from "../ConsultationFeeModal";
import { useGetConsultationFeeQuery } from "@/redux/api/adminDashboard/siteSettingsApi";

interface ClientMeetingPaymentTabProps {
    project: any;
    paymentInfo: any;
    amendments: any[];
    isCreatingCheckout: boolean;
    onPay: (stageId?: string, stageName?: string, amount?: number) => void;
    onPayAmendment: (
        amendmentProposalId: string,
        amount: number,
        title: string,
        serviceId?: string,
        serviceName?: string
    ) => void;
    onRequestRefund: (stage: any) => void;
    /** Phases with an approved refund - dropped from the view entirely. */
    refundedStageIds?: Set<string>;
    onViewAmendmentContract: (proposalId: string) => void;
    /** Refetch project + payment data after the consultation fee is settled. */
    onConsultationPaid?: () => void;
}

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

export default function ClientMeetingPaymentTab({
    project,
    paymentInfo,
    amendments,
    isCreatingCheckout,
    onPay,
    onPayAmendment,
    onRequestRefund,
    refundedStageIds,
    onViewAmendmentContract,
    onConsultationPaid,
}: ClientMeetingPaymentTabProps) {
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
    const [phaseForMeeting, setPhaseForMeeting] = useState<any>(null);
    const [respondingMeetingId, setRespondingMeetingId] = useState<string | null>(null);

    const { data: consultationFeeData } = useGetConsultationFeeQuery();
    const consultationFee = consultationFeeData?.data?.feeUsd;

    const [requestMeeting, { isLoading: isRequesting }] = useRequestMeetingMutation();
    const [respondToMeeting, { isLoading: isResponding }] = useRespondToMeetingMutation();
    const [bypassPhaseMeeting, { isLoading: isBypassing }] = useBypassPhaseMeetingMutation();

    const meetings = project.meetingLinks || [];

    // The consultation happens once. Once it's on the books, anything the
    // client requests afterwards is a follow-up — free, and labelled as such.
    // The server decides this the same way; this is only for the wording.
    const hasHadConsultation = meetings.some(
        (m: any) =>
            m.meetingType === "INITIAL_CONSULTATION" && m.status !== "DECLINED",
    );
    // Memoised so the contract grouping below is not recomputed every render.
    // A phase with an approved refund is no longer the client's, so it is
    // excluded before anything downstream sees it.
    const stages = useMemo(
        () =>
            (project.stages || []).filter((s: any) => !refundedStageIds?.has(s.id)),
        [project.stages, refundedStageIds]
    );
    const lumpSum = isLumpSum(paymentInfo);

    // Inquiries a PM created on the client's behalf skip the public intake form,
    // so the consultation fee was never collected. The backend rejects meeting
    // requests until it is — surface that here instead of a bare 403 toast.
    // While the status is still loading, assume paid — a "fee due" banner that
    // flashes at a client who already paid is worse than a moment of nothing.
    // The backend rejects the request either way.
    const consultationPaid = paymentInfo
        ? (paymentInfo.consultationPaid ?? !!project.consultationPaymentId)
        : true;

    /** Opens the meeting modal, or the fee modal first when the fee is unpaid. */
    const openMeetingRequest = (stage: any | null) => {
        if (!consultationPaid) {
            toast.info("Please pay the consultation fee before requesting a meeting.");
            setIsConsultationModalOpen(true);
            return;
        }
        setPhaseForMeeting(stage);
        setIsMeetingModalOpen(true);
    };
    const isPaidAll = paymentInfo?.lumpSumPaid;
    const amendmentPayments = paymentInfo?.amendmentPayments || [];

    // Phase meetings only become available once the client has accepted a contract.
    const hasAcceptedContract = (project.proposals || []).some(
        (p: any) => p.status === "ACCEPTED"
    );

    const amendmentProposalIds = new Set(
        amendments.map((a: any) => a.amendmentProposalId).filter(Boolean)
    );

    // Split meetings by whether they belong to an amendment proposal's phases.
    const amendmentStageIds = new Set(
        stages
            .filter((s: any) => s.proposalId && amendmentProposalIds.has(s.proposalId))
            .map((s: any) => s.id)
    );
    const originalMeetings = meetings.filter((m: any) => !amendmentStageIds.has(m.stageId));
    const amendmentMeetings = meetings.filter((m: any) => amendmentStageIds.has(m.stageId));

    // Phases belong to a contract - the original proposal or an amendment.
    // Grouping them keeps each contract's phases together and gives the refund
    // button somewhere sensible to live (one per contract, not per phase).
    const ORIGINAL_KEY = "__original__";
    const contractGroups = useMemo(() => {
        const proposals = project.proposals || [];
        const byId = new Map(proposals.map((p: any) => [p.id, p]));
        const groups = new Map<string, any>();

        stages.forEach((stage: any) => {
            const key = stage.proposalId && byId.has(stage.proposalId) ? stage.proposalId : ORIGINAL_KEY;
            if (!groups.has(key)) {
                const proposal: any = byId.get(key);
                groups.set(key, {
                    key,
                    proposalId: key === ORIGINAL_KEY ? null : key,
                    title:
                        proposal?.title ||
                        proposal?.projectName ||
                        `${project.projectName} (Original Contract)`,
                    proposalNumber: proposal?.proposalNumber || null,
                    isAmendment: proposal?.proposalType === "AMENDMENT",
                    stages: [],
                });
            }
            groups.get(key).stages.push(stage);
        });

        // Original contract first, amendments after.
        return Array.from(groups.values())
            .sort((a, b) => Number(a.isAmendment) - Number(b.isAmendment))
            .map((group) => {
                // Only paid phases can be refunded.
                const refundablePhases = group.stages
                    .map((stage: any) => {
                        const info = paymentInfo?.stages?.find((s: any) => s.stageId === stage.id);
                        const paid = isPaidAll || info?.paid;
                        return paid
                            ? { id: stage.id, name: stage.name, amount: info?.amount || 0 }
                            : null;
                    })
                    .filter(Boolean);
                return { ...group, refundablePhases };
            });
    }, [stages, project, paymentInfo, isPaidAll]);

    // A lump-sum plan has no installment rows, so its refund entry point is the
    // summary card. Everything is paid, so the whole original contract qualifies.
    const lumpSumRefundContract = useMemo(
        () =>
            contractGroups.find(
                (group: any) => !group.isAmendment && group.refundablePhases.length > 0
            ) || null,
        [contractGroups]
    );

    const handleMeetingResponse = async (meetingId: string, action: "accept" | "reject") => {
        setRespondingMeetingId(meetingId);
        try {
            await respondToMeeting({ meetingId, action }).unwrap();
            toast.success(action === "accept" ? "Meeting confirmed!" : "Meeting declined.");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to respond to meeting");
        } finally {
            setRespondingMeetingId(null);
        }
    };

    const handleSubmitMeeting = async (form: {
        scheduledAt: string;
        endsAt: string;
        notes: string;
        notNecessary: boolean;
    }) => {
        // "Meeting not necessary" only applies to a specific phase.
        if (form.notNecessary && phaseForMeeting) {
            try {
                await bypassPhaseMeeting({ stageId: phaseForMeeting.id, bypassed: true }).unwrap();
                toast.success("Noted — we'll skip the meeting for this phase.");
                setIsMeetingModalOpen(false);
                setPhaseForMeeting(null);
            } catch (error: any) {
                toast.error(error?.data?.message || "Failed to update meeting preference");
            }
            return;
        }

        if (!form.scheduledAt) {
            toast.error("Please select a preferred date and time slot");
            return;
        }

        try {
            await requestMeeting({
                projectRequestId: project.id,
                scheduledAt: form.scheduledAt,
                endsAt: form.endsAt || undefined,
                notes: form.notes,
                stageId: phaseForMeeting?.id,
                // The server decides whether this is the initial consultation
                // or a follow-up, from what the project already has — a client
                // shouldn't be able to label their own meeting.
            }).unwrap();
            toast.success("Meeting request sent! The project manager will get back to you.");
            setIsMeetingModalOpen(false);
            setPhaseForMeeting(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to send meeting request");
        }
    };

    const MeetingCard = ({ meeting }: { meeting: any }) => {
        const isOwnRequest = meeting.status === "PENDING_CLIENT_REQUEST";
        const needsClientResponse = meeting.status === "PENDING_RESPONSE";
        const isAccepted = meeting.status === "ACCEPTED";
        const isDeclined = meeting.status === "DECLINED";
        const isRespondingThis = isResponding && respondingMeetingId === meeting.id;
        const stage = stages.find((s: any) => s.id === meeting.stageId);

        return (
            <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isOwnRequest || needsClientResponse
                                ? "bg-amber-50 border-amber-100"
                                : isAccepted
                                    ? "bg-emerald-50 border-emerald-100"
                                    : "bg-gray-50 border-gray-100"
                                }`}
                        >
                            <VideoIcon
                                className={`w-5 h-5 ${isOwnRequest || needsClientResponse
                                    ? "text-amber-600"
                                    : isAccepted
                                        ? "text-emerald-600"
                                        : "text-gray-400"
                                    }`}
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-sm font-bold text-gray-900">{meeting.title}</h5>
                                {stage && (
                                    <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-blue-100">
                                        {stage.name}
                                    </span>
                                )}
                                {isOwnRequest && (
                                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-amber-200">
                                        Waiting for Response
                                    </span>
                                )}
                                {needsClientResponse && (
                                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-amber-200">
                                        Action Needed
                                    </span>
                                )}
                                {isDeclined && (
                                    <span className="text-[9px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-red-200">
                                        Declined
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(meeting.scheduledAt)}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(meeting.scheduledAt)}
                                </span>
                            </div>
                            {/* External date set by the PM for this phase */}
                            {stage?.externalDeadline && (
                                <span className="text-[10px] text-indigo-600 font-bold mt-1 block">
                                    External Date:{" "}
                                    {new Date(stage.externalDeadline).toLocaleDateString("en-US", {
                                        month: "2-digit",
                                        day: "2-digit",
                                        year: "numeric",
                                    })}
                                </span>
                            )}
                            {meeting.sentByUser && !isOwnRequest && (
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                    Organized by {meeting.sentByUser.name}
                                </span>
                            )}
                            {meeting.notes && (
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{meeting.notes}</p>
                            )}
                        </div>
                    </div>
                    {needsClientResponse ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                                onClick={() => handleMeetingResponse(meeting.id, "accept")}
                                disabled={isRespondingThis}
                                className="inline-flex items-center justify-center w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                title="Accept"
                            >
                                {isRespondingThis ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => handleMeetingResponse(meeting.id, "reject")}
                                disabled={isRespondingThis}
                                className="inline-flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                title="Decline"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : isAccepted && meeting.meetingUrl ? (
                        consultationPaid ? (
                            <a
                                href={toExternalUrl(meeting.meetingUrl) ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                            >
                                <ExternalLink className="w-3 h-3" />
                                JOIN
                            </a>
                        ) : (
                            <button
                                onClick={() => setIsConsultationModalOpen(true)}
                                title="Pay the consultation fee to join this meeting"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                            >
                                <Lock className="w-3 h-3" />
                                JOIN
                            </button>
                        )
                    ) : isOwnRequest ? (
                        <div className="px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-tight flex-shrink-0">
                            Requested
                        </div>
                    ) : null}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Header with Request a Meeting on the top right */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Meetings &amp; Payment
                </h4>
                <button
                    onClick={() => openMeetingRequest(null)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-[11px] font-bold border rounded-lg transition-colors active:scale-95 ${consultationPaid
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
                        : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                    title={
                        consultationPaid
                            ? undefined
                            : "Pay the consultation fee to request a meeting"
                    }
                >
                    {consultationPaid ? (
                        <CalendarPlus className="w-3.5 h-3.5" />
                    ) : (
                        <Lock className="w-3.5 h-3.5" />
                    )}
                    Request a Meeting
                </button>
            </div>

            {/* ═══ CONSULTATION FEE ═══ */}
            {!consultationPaid && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
                                    <Lock size={18} />
                                </div>
                                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">
                                    Consultation Fee Due
                                </h4>
                            </div>
                            <p className="text-xs text-amber-700 font-medium">
                                Pay the one-time consultation fee to unlock meeting requests for
                                this project.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">
                                    Amount
                                </p>
                                <p className="text-2xl font-black text-amber-900 leading-none">
                                    {typeof consultationFee === "number"
                                        ? `$${consultationFee.toFixed(2)}`
                                        : "—"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsConsultationModalOpen(true)}
                                className="px-6 py-3 cursor-pointer bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95 whitespace-nowrap"
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PAYMENTS ═══ */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                <CreditCard size={18} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                {paymentPlanLabel(paymentInfo)}
                            </h4>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">
                            {paymentPlanDescription(paymentInfo)}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                                {lumpSum ? "Total Due" : "Contract Total"}
                            </p>
                            <p className="text-2xl font-black text-gray-900 leading-none">
                                ${Number(paymentInfo?.totalAmount || 0).toLocaleString()}
                            </p>
                        </div>

                        {lumpSum &&
                            (isPaidAll ? (
                                // A lump-sum contract has no installment rows, so
                                // its refund entry point lives here.
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-200">
                                        <CheckCircle2 size={14} /> Fully Paid
                                    </span>
                                    {lumpSumRefundContract && (
                                        <button
                                            onClick={() => onRequestRefund(lumpSumRefundContract)}
                                            className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-black text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 active:scale-95"
                                        >
                                            <RefreshCcw className="w-3 h-3" />
                                            REQUEST REFUND
                                        </button>
                                    )}
                                </div>
                            ) : (
                                (paymentInfo?.totalAmount || 0) > 0 && (
                                    <button
                                        onClick={() => onPay()}
                                        disabled={isCreatingCheckout}
                                        className="px-6 py-3 cursor-pointer bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isCreatingCheckout
                                            ? "Wait..."
                                            : `Pay $${Number(paymentInfo?.totalAmount || 0).toLocaleString()} Now`}
                                    </button>
                                )
                            ))}
                    </div>
                </div>
            </div>

            {/* Per-phase installments */}
            {!lumpSum && stages.length > 0 && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Phase Installments
                        </h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-6 mb-8">
                        {contractGroups.map((group: any) => (
                            <div key={group.key} className="space-y-2">
                                {/* Contract header — refunds are requested here */}
                                <div className="flex items-center justify-between gap-3 flex-wrap px-1">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h5 className="text-sm font-black text-gray-900 truncate">
                                                {group.title}
                                            </h5>
                                            {group.isAmendment && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-black rounded border border-purple-100 uppercase tracking-tighter">
                                                    Amendment
                                                </span>
                                            )}
                                        </div>
                                        {group.proposalNumber && (
                                            <p className="text-[10px] text-gray-400 font-mono">
                                                {group.proposalNumber}
                                            </p>
                                        )}
                                    </div>
                                    {group.refundablePhases.length > 0 && (
                                        <button
                                            onClick={() => onRequestRefund(group)}
                                            className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-black text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 active:scale-95 flex-shrink-0"
                                        >
                                            <RefreshCcw className="w-3 h-3" />
                                            REQUEST REFUND
                                        </button>
                                    )}
                                </div>

                                {group.stages.map((stage: any, idx: number) => {
                                    const info = paymentInfo?.stages?.find((s: any) => s.stageId === stage.id);
                                    const paid = isPaidAll || info?.paid;
                                    const amount = info?.amount || 0;
                                    return (
                                        <div
                                            key={stage.id}
                                            className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl p-4 bg-white flex-wrap"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                        Phase {idx + 1}
                                                    </span>
                                                    <h5 className="text-sm font-bold text-gray-900">{stage.name}</h5>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    ${amount.toLocaleString()}
                                                </p>
                                            </div>
                                            {/* Refunds are requested per contract, from
                                        the header above — not per phase. */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {paid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-[10px] font-black uppercase border border-green-200">
                                                        <CheckCircle2 size={12} /> Paid
                                                    </span>
                                                ) : info?.canPay ? (
                                                    <button
                                                        onClick={() => onPay(stage.id, stage.name, amount)}
                                                        disabled={isCreatingCheckout}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg active:scale-95 disabled:opacity-50"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        PAY ${amount.toLocaleString()}
                                                    </button>
                                                ) : (
                                                    <span className="px-3 py-2 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg border border-gray-100 uppercase">
                                                        Not Due Yet
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ─── Amendment payments ─── */}
            {amendmentPayments.length > 0 && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Amendment Payments
                        </h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-4 mb-8">
                        {amendmentPayments.map((ap: any) => {
                            const apLumpSum = ap.paymentMethod === "LUMP_SUM";
                            return (
                                <div
                                    key={ap.proposalId}
                                    className={`relative overflow-hidden border-2 rounded-2xl p-5 shadow-sm ${ap.paid
                                        ? "border-green-200 bg-green-50/30"
                                        : ap.awaitingSignature
                                            ? "border-gray-200 bg-gray-50/60"
                                            : "border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40"
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0 left-0 right-0 h-1 ${ap.paid
                                            ? "bg-green-500"
                                            : ap.awaitingSignature
                                                ? "bg-gray-300"
                                                : "bg-gradient-to-r from-amber-400 to-orange-500"
                                            }`}
                                    />

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`p-2 rounded-xl border ${ap.paid
                                                        ? "bg-green-100 text-green-600 border-green-200"
                                                        : "bg-amber-100 text-amber-600 border-amber-200"
                                                        }`}
                                                >
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide truncate">
                                                        {ap.title}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 font-medium">
                                                        {ap.proposalNumber} •{" "}
                                                        {apLumpSum ? "Lump sum" : "By phase completion"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                                                    Amount Due
                                                </p>
                                                <p className="text-2xl font-black text-gray-900 leading-none">
                                                    ${Number(ap.amount || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            {ap.paid ? (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                    <CheckCircle2 size={14} /> Paid
                                                </span>
                                            ) : ap.awaitingSignature ? (
                                                <button
                                                    onClick={() => onViewAmendmentContract(ap.proposalId)}
                                                    className="px-5 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 whitespace-nowrap"
                                                >
                                                    Sign Contract First
                                                </button>
                                            ) : apLumpSum ? (
                                                <button
                                                    onClick={() =>
                                                        onPayAmendment(ap.proposalId, ap.amount, ap.title)
                                                    }
                                                    disabled={isCreatingCheckout}
                                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-amber-600 hover:to-orange-700 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {isCreatingCheckout
                                                        ? "Wait..."
                                                        : `Pay $${Number(ap.amount || 0).toLocaleString()}`}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* By-phase amendments bill each service separately */}
                                    {ap.services && ap.services.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/60">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">
                                                Amendment Services
                                            </p>
                                            <div className="space-y-1.5">
                                                {ap.services.map((s: any) => (
                                                    <div
                                                        key={s.serviceId || s.id}
                                                        className="flex items-center justify-between gap-3 text-xs bg-white/70 px-3 py-2 rounded-lg border border-gray-100"
                                                    >
                                                        <span className="text-gray-700 font-medium truncate">
                                                            {s.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="text-gray-900 font-bold">
                                                                ${Number(s.amount || 0).toLocaleString()}
                                                            </span>
                                                            {!apLumpSum &&
                                                                !ap.awaitingSignature &&
                                                                (s.paid ? (
                                                                    <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 uppercase">
                                                                        Paid
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() =>
                                                                            onPayAmendment(
                                                                                ap.proposalId,
                                                                                Number(s.amount || 0),
                                                                                ap.title,
                                                                                s.serviceId,
                                                                                s.name
                                                                            )
                                                                        }
                                                                        disabled={isCreatingCheckout}
                                                                        className="text-[9px] font-black text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded uppercase active:scale-95 disabled:opacity-50"
                                                                    >
                                                                        Pay
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── PHASE PROGRESS MEETINGS — TEMPORARILY DISABLED (2026-08-31) ──
                Only initial-consultation requests are live for now. Re-enable
                by removing the `false &&` wrapper (the backend phase-meeting
                logic must be restored too). */}
            {false && (
              <>
            <div className="flex items-center gap-3 mb-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Phase Progress Meetings
                </h4>
                <div className="flex-1 h-px bg-gray-100" />
            </div>

            {!hasAcceptedContract ? (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-8">
                    <Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">Phase meetings locked</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Once you approve your contract, you'll be able to book a walkthrough call for each
                        completed phase.
                    </p>
                </div>
            ) : stages.length === 0 ? (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-8">
                    <p className="text-gray-500 font-semibold text-sm">No phases yet</p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {stages.map((stage: any, idx: number) => {
                        const isCompleted = stage.status === "COMPLETED";
                        const stagePaymentInfo = paymentInfo?.stages?.find(
                            (s: any) => s.stageId === stage.id
                        );
                        const isStagePaid = isPaidAll || stagePaymentInfo?.paid;
                        const stageAmount = stagePaymentInfo?.amount;
                        const bypassed = stage.clientBypassedMeeting;
                        const meetingRequired = stage.meetingRequired !== false;

                        // Existing meeting for this phase, if any
                        const phaseMeeting = meetings.find((m: any) => m.stageId === stage.id);

                        // Gate: phase complete -> (installment ? paid : true) -> can set up
                        const needsPayment = !lumpSum && !isStagePaid;
                        const canSetUp = isCompleted && !needsPayment && !bypassed && !phaseMeeting;

                        return (
                            <div
                                key={stage.id}
                                className="border border-gray-200 rounded-xl p-4 bg-white flex items-center justify-between gap-3 flex-wrap"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                            Phase {idx + 1}
                                        </span>
                                        <h5 className="text-sm font-bold text-gray-900">{stage.name}</h5>
                                        {isCompleted ? (
                                            <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase border border-green-200">
                                                Completed
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase border border-amber-200">
                                                {stage.status}
                                            </span>
                                        )}
                                        {!meetingRequired && (
                                            <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase border border-gray-200">
                                                Meeting Optional
                                            </span>
                                        )}
                                    </div>
                                    {stage.externalDeadline && (
                                        <span className="text-[10px] text-indigo-600 font-bold mt-1 block">
                                            External Date:{" "}
                                            {new Date(stage.externalDeadline).toLocaleDateString("en-US", {
                                                month: "2-digit",
                                                day: "2-digit",
                                                year: "numeric",
                                            })}
                                        </span>
                                    )}
                                    {bypassed && (
                                        <span className="text-[10px] text-gray-500 font-medium mt-1 block">
                                            You chose to skip the meeting for this phase.
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Installment payment must clear before booking */}
                                    {isCompleted && needsPayment && (
                                        <button
                                            onClick={() => onPay(stage.id, stage.name, stageAmount)}
                                            disabled={isCreatingCheckout}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                                        >
                                            <DollarSign className="w-3.5 h-3.5" />
                                            PAY ${stageAmount?.toLocaleString() || 0}
                                        </button>
                                    )}

                                    {phaseMeeting ? (
                                        <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-tight">
                                            Meeting {phaseMeeting.status === "ACCEPTED" ? "Booked" : "Requested"}
                                        </span>
                                    ) : canSetUp ? (
                                        <>
                                            <button
                                                onClick={() => openMeetingRequest(stage)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-lg transition-colors active:scale-95 uppercase tracking-wide"
                                            >
                                                Set Up
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await bypassPhaseMeeting({
                                                            stageId: stage.id,
                                                            bypassed: true,
                                                        }).unwrap();
                                                        toast.success("Meeting skipped for this phase.");
                                                    } catch (error: any) {
                                                        toast.error(
                                                            error?.data?.message || "Failed to skip meeting"
                                                        );
                                                    }
                                                }}
                                                disabled={isBypassing}
                                                title="Skip the meeting for this phase"
                                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                                            >
                                                <SkipForward className="w-3.5 h-3.5" />
                                                Skip
                                            </button>
                                        </>
                                    ) : !isCompleted ? (
                                        <span className="px-3 py-2 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-tight">
                                            Awaiting Completion
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
              </>
            )}
            {/* ── end PHASE PROGRESS MEETINGS (disabled) ── */}

            {/* ─── Original Proposal meetings ─── */}
            <div className="flex items-center gap-3 mb-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Original Proposal
                </h4>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">
                    {originalMeetings.length} meeting{originalMeetings.length !== 1 ? "s" : ""}
                </span>
            </div>
            {originalMeetings.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-8">
                    <p className="text-gray-500 font-semibold text-sm">No scheduled meetings</p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {originalMeetings.map((m: any) => (
                        <MeetingCard key={m.id} meeting={m} />
                    ))}
                </div>
            )}

            {/* ─── Amendment meetings ─── */}
            {amendmentMeetings.length > 0 && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Proposal Amendments
                        </h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-3 mb-6">
                        {amendmentMeetings.map((m: any) => (
                            <MeetingCard key={m.id} meeting={m} />
                        ))}
                    </div>
                </>
            )}

            <RequestMeetingModal
                isOpen={isMeetingModalOpen}
                isLoading={isRequesting || isBypassing}
                projectName={project.projectName}
                projectRequestId={project.id}
                phaseName={phaseForMeeting?.name}
                isFollowUp={hasHadConsultation}
                // The fee is only ever charged for the initial consultation, so
                // it isn't quoted on a phase or follow-up request.
                consultationFee={
                    phaseForMeeting || hasHadConsultation ? undefined : consultationFee
                }
                consultationFeePaid={consultationPaid}
                allowBypass={!!phaseForMeeting}
                onClose={() => {
                    setIsMeetingModalOpen(false);
                    setPhaseForMeeting(null);
                }}
                onSubmit={handleSubmitMeeting}
            />

            <ConsultationFeeModal
                isOpen={isConsultationModalOpen}
                projectRequestId={project.id}
                projectName={project.projectName}
                clientEmail={project.email || ""}
                onClose={() => setIsConsultationModalOpen(false)}
                onPaid={() => {
                    setIsConsultationModalOpen(false);
                    // The fee is recorded on the project request, so the project
                    // list and payment status both need to come back fresh.
                    onConsultationPaid?.();
                }}
            />
        </>
    );
}
