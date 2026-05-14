import { X, CheckCircle2, Clock, ExternalLink, Package, MapPin, Mail, Phone, Building2, User, Calendar, VideoIcon, Loader2, DollarSign, CreditCard, RefreshCcw, FileText } from "lucide-react";
import { useGetAmendmentsByProjectQuery } from "@/redux/api/amendmentApi";
import { useGetProjectRequestByIdQuery } from "@/redux/api/adminDashboard/proposalApi";
import { useGetPaymentStatusQuery, useCreateCheckoutSessionMutation } from "@/redux/api/paymentApi";
import { useGetUserBankDetailsQuery, useCreateRefundRequestMutation } from "@/redux/api/refundApi";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import RefundBankDetailsModal, { BankDetails } from "./RefundBankDetailsModal";
import RefundCauseModal from "./RefundCauseModal";
import { useSearchParams } from "react-router-dom";

interface ClientProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

export default function ClientProjectDetailsModal({ isOpen, onClose, project: initialProject }: ClientProjectDetailsModalProps) {
    const { data: latestProject, isLoading } = useGetProjectRequestByIdQuery(initialProject?.id, {
        skip: !isOpen || !initialProject?.id,
        refetchOnMountOrArgChange: true,
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const paymentResult = searchParams.get("payment");

    const { data: paymentData, refetch: refetchPayment } = useGetPaymentStatusQuery(initialProject?.id, {
        skip: !isOpen || !initialProject?.id,
    });

    const { data: amendmentsData } = useGetAmendmentsByProjectQuery({ projectId: initialProject?.id }, {
        skip: !isOpen || !initialProject?.id,
    });

    const { data: bankData } = useGetUserBankDetailsQuery(undefined, {
        skip: !isOpen,
    });

    const [createCheckout, { isLoading: isCreatingCheckout }] = useCreateCheckoutSessionMutation();
    const [createRefund, { isLoading: isSubmittingRefund }] = useCreateRefundRequestMutation();

    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedStageForRefund, setSelectedStageForRefund] = useState<any>(null);
    const [pendingBankDetails, setPendingBankDetails] = useState<BankDetails | null>(null);

    const project = latestProject || initialProject;

    useEffect(() => {
        if (paymentResult === "success") {
            toast.success("Payment successful! Files are now accessible.");
            // Remove the query param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("payment");
            newParams.delete("paymentId");
            setSearchParams(newParams);
            refetchPayment();
        } else if (paymentResult === "cancelled") {
            toast.error("Payment was cancelled.");
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("payment");
            setSearchParams(newParams);
        }
    }, [paymentResult]);

    const handlePay = async (stageId?: string, stageName?: string, amount?: number) => {
        try {
            const proposal = paymentData?.data?.proposal;
            if (!proposal) {
                toast.error("Proposal information not found");
                return;
            }

            const res = await createCheckout({
                projectRequestId: project.id,
                proposalId: proposal.id,
                stageId: stageId || undefined,
                stageName: stageName || undefined,
                amount: amount || (paymentData?.data?.totalAmount || 0),
                paymentType: paymentData?.data?.paymentMethod || "LUMP_SUM",
                projectName: project.projectName,
            }).unwrap();

            if (res.data?.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            }
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to initiate payment");
        }
    };

    const handlePayAmendment = async (amendmentProposalId: string, amount: number, title: string) => {
        try {
            const res = await createCheckout({
                projectRequestId: project.id,
                proposalId: amendmentProposalId,
                amount,
                paymentType: "LUMP_SUM",
                projectName: `${project.projectName} — Amendment: ${title}`,
            }).unwrap();

            if (res.data?.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            }
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to initiate amendment payment");
        }
    };

    const handleRequestRefundClick = (stage: any) => {
        setSelectedStageForRefund(stage);
        if (!bankData?.data) {
            setBankModalOpen(true);
        } else {
            setRefundModalOpen(true);
        }
    };

    const handleBankDetailsSubmit = async (details: BankDetails) => {
        setPendingBankDetails(details);
        setBankModalOpen(false);
        setRefundModalOpen(true);
    };

    const handleRefundSubmit = async (refundDetails: { refundCause: string; refundDescription: string }) => {
        try {
            const stagePaymentInfo = paymentData?.data?.stages?.find((s: any) => s.stageId === selectedStageForRefund.id);
            const stageAmount = stagePaymentInfo?.amount || 0;

            await createRefund({
                projectRequestId: project.id,
                stageId: selectedStageForRefund.id,
                stageName: selectedStageForRefund.name,
                refundCause: refundDetails.refundCause,
                refundDescription: refundDetails.refundDescription,
                amount: stageAmount,
                bankDetails: pendingBankDetails || undefined,
            }).unwrap();

            toast.success("Refund request submitted successfully");
            setRefundModalOpen(false);
            setSelectedStageForRefund(null);
            setPendingBankDetails(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to submit refund request");
        }
    };

    if (!isOpen || !project) return null;

    const paymentInfo = paymentData?.data;
    const isLumpSum = paymentInfo?.paymentMethod === 'LUMP_SUM';
    const isPaidAll = paymentInfo?.lumpSumPaid;

    const stages = project.stages || [];
    const completedStages = stages.filter((s: any) => s.status === "COMPLETED");
    const progress = stages.length > 0
        ? Math.round((completedStages.length / stages.length) * 100)
        : 0;

    const meetings = project.meetingLinks || [];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDaysUntil = (dateStr: string) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const deadline = new Date(dateStr);
        deadline.setHours(0, 0, 0, 0);
        const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getDeadlineColor = (dateStr: string) => {
        const days = getDaysUntil(dateStr);
        if (days < 0) return "text-red-600 bg-red-50 border-red-200";
        if (days <= 3) return "text-red-700 bg-red-50 border-red-100";
        if (days <= 7) return "text-amber-700 bg-amber-50 border-amber-100";
        return "text-gray-500 bg-gray-50 border-gray-100";
    };

    const fullClientName = `${project.clientFirstName || ''} ${project.clientMiddleName || ''} ${project.clientLastName || ''}`.trim();
    const projectAddress = [project.projectStreetAddress, project.projectCity, project.projectState, project.projectCountry].filter(Boolean).join(", ");
    const clientAddress = [project.streetAddress, project.city, project.state, project.country].filter(Boolean).join(", ");

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight">{project.projectName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-tighter">
                                    {(project.serviceType || "").replace(/_/g, " ")}
                                </span>
                                {project.projectCategory && (
                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100 uppercase tracking-tighter">
                                        {project.projectCategory}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Project Details</span>
                                {isLoading && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full animate-pulse border border-blue-100 flex-shrink-0">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        <span className="text-[9px] font-bold uppercase">Refreshing</span>
                                    </div>
                                )}
                                </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                        >
                            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200">

                        {/* Project Information Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Client Info Card */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    Client Information
                                </h4>
                                <div className="space-y-3">
                                    {fullClientName && (
                                        <div className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-sm text-gray-900 font-medium">{fullClientName}</span>
                                        </div>
                                    )}
                                    {project.companyName && (
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-sm text-gray-700">{project.companyName}</span>
                                        </div>
                                    )}
                                    {project.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-sm text-gray-700">{project.email}</span>
                                        </div>
                                    )}
                                    {project.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-sm text-gray-700">{project.phone}</span>
                                        </div>
                                    )}
                                    {clientAddress && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                            <span className="text-sm text-gray-600">{clientAddress}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Project Details Card */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Project Details
                                </h4>
                                <div className="space-y-3">
                                    {projectAddress && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">Location</span>
                                                <span className="text-sm text-gray-700">{projectAddress}</span>
                                            </div>
                                        </div>
                                    )}
                                    {project.projectSize && (
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Project Size</span>
                                            <span className="text-sm text-gray-700">{project.projectSize}</span>
                                        </div>
                                    )}
                                    {project.budgetRange && (
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Budget Range</span>
                                            <span className="text-sm text-orange-600 font-medium">{project.budgetRange}</span>
                                        </div>
                                    )}
                                    {project.preferredArchitecturalStyle && (
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Architectural Style</span>
                                            <span className="text-sm text-gray-700">{project.preferredArchitecturalStyle}</span>
                                        </div>
                                    )}
                                    {project.siteConstraints && (
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Site Constraints</span>
                                            <span className="text-sm text-gray-700">{project.siteConstraints}</span>
                                        </div>
                                    )}
                                    {project.sustainabilityGoals && (
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Sustainability Goals</span>
                                            <span className="text-sm text-gray-700">{project.sustainabilityGoals}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Status Overview Card */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                        <CreditCard size={18} />
                                    </div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payment Strategy</h4>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">
                                    {isLumpSum
                                        ? "One-time full project payment required"
                                        : "Pay-as-you-go per project phase"
                                    }
                                </p>
                                {paymentInfo?.consultationPaid && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase rounded border border-green-100 flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Consultation Fee Paid ($250)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        {isLumpSum ? (
                                            isPaidAll ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                    <CheckCircle2 size={12} /> Fully Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest border border-red-200">
                                                    <Clock size={12} /> Payment Due
                                                </span>
                                            )
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200">
                                                <RefreshCcw size={12} /> Installment Plan
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isLumpSum && !isPaidAll && (
                                    <button
                                        onClick={() => handlePay()}
                                        disabled={isCreatingCheckout}
                                        className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {isCreatingCheckout ? "Wait..." : `Pay $${paymentInfo?.totalAmount?.toLocaleString()} Now`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── Amendment Payments Section ─── */}
                    {paymentInfo?.amendmentPayments && paymentInfo.amendmentPayments.length > 0 && (
                        <div className="space-y-4 mb-8">
                            {paymentInfo.amendmentPayments.map((ap: any) => (
                                <div
                                    key={ap.proposalId}
                                    className={`relative overflow-hidden border-2 rounded-2xl p-6 shadow-sm transition-all ${
                                        ap.paid
                                            ? 'border-green-200 bg-green-50/30'
                                            : 'border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40'
                                    }`}
                                >
                                    {/* Top accent stripe */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${ap.paid ? 'bg-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-2 rounded-xl border ${ap.paid ? 'bg-green-100 text-green-600 border-green-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                                                        Amendment Payment
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 font-medium">{ap.proposalNumber}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700 font-semibold mt-1">{ap.title}</p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Amount Due</p>
                                                <p className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                                                    ${ap.amount?.toLocaleString()}
                                                </p>
                                            </div>

                                            {ap.paid ? (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                    <CheckCircle2 size={14} /> Paid
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handlePayAmendment(ap.proposalId, ap.amount, ap.title)}
                                                    disabled={isCreatingCheckout}
                                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {isCreatingCheckout ? "Wait..." : `Pay $${ap.amount?.toLocaleString()}`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Services breakdown */}
                                    {ap.services && ap.services.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/60">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">Amendment Services</p>
                                            <div className="space-y-1.5">
                                                {ap.services.map((s: any) => (
                                                    <div key={s.id} className="flex items-center justify-between text-xs bg-white/70 px-3 py-2 rounded-lg border border-gray-100">
                                                        <span className="text-gray-700 font-medium">{s.name}</span>
                                                        <span className="text-gray-900 font-bold">${Number(s.amount || 0).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Decorative glow */}
                                    {!ap.paid && (
                                        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Amendment Status Notification (for client) */}
                    {(amendmentsData?.data?.length || 0) > 0 && (
                        <div className="mb-8 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Amendment Requests</h4>
                            </div>
                            {amendmentsData?.data?.map((amendment: any) => (
                                <div key={amendment.id} className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${amendment.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : amendment.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{amendment.projectName}</p>
                                            <p className="text-[10px] text-gray-500">Status: <span className="font-bold uppercase">{amendment.status}</span></p>
                                        </div>
                                    </div>
                                    {amendment.amendmentProposalId && (
                                        <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                                            Proposal Ready
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress Overview Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 mb-8 border border-blue-100/50 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1">Current Progress</span>
                                    <span className="text-sm font-medium text-blue-700">Completion rate for all project phases</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-blue-600 block leading-none">{progress}%</span>
                                </div>
                            </div>
                            <div className="h-4 bg-white/60 rounded-full p-0.5 border border-blue-200 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1500 ease-out rounded-full shadow-lg relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                    </div>

                    {/* Project Phases */}
                    <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Project Workflow Phases</h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {stages.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-8">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-semibold mb-1">Phases Pending</p>
                            <p className="text-xs text-gray-400 max-w-[200px] mx-auto italic">
                                Individual project phases will appear here once the contract transition is complete.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5 mb-8">
                            {stages.map((stage: any, idx: number) => {
                                const isCompleted = stage.status === "COMPLETED";
                                const stagePaymentInfo = paymentInfo?.stages?.find((s: any) => s.stageId === stage.id);
                                const isStagePaid = isPaidAll || stagePaymentInfo?.paid;
                                const canPayStage = stagePaymentInfo?.canPay;
                                const stageAmount = stagePaymentInfo?.amount;

                                return (
                                    <div
                                        key={stage.id}
                                        className={`group relative border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${isCompleted
                                            ? 'bg-green-50/30 border-green-100 shadow-green-900/5'
                                            : 'bg-white border-gray-200 shadow-gray-200/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${isCompleted
                                                    ? 'bg-green-100 text-green-600 border-green-200'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Phase {idx + 1}</span>
                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${isCompleted ? 'bg-green-100/50 text-green-700 border-green-200/50' : 'bg-amber-100/50 text-amber-700 border-amber-200/50'
                                                            }`}>
                                                            {stage.status}
                                                        </span>
                                                        {stage.externalDeadline && !isCompleted && (
                                                            <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${getDeadlineColor(stage.externalDeadline)}`}>
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                Deadline: {new Date(stage.externalDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                {getDaysUntil(stage.externalDeadline) < 0 && " (OVERDUE)"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5 className={`font-bold text-base leading-tight ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                                                        {stage.name}
                                                    </h5>
                                                    {stage.description && (
                                                        <p className="text-xs text-gray-500 mt-2 leading-relaxed opacity-80 line-clamp-2">
                                                            {stage.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-tighter">
                                                <span>Work Progress</span>
                                                <span className={isCompleted ? 'text-green-600' : 'text-blue-600'}>{stage.progress || 0}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-in-out ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20' : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20'
                                                        }`}
                                                    style={{ width: `${stage.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Drive Link & Payment Logic */}
                                        <div className="pt-4 border-t border-gray-100/60 flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                {stage.driveLink ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isStagePaid ? 'bg-blue-500 animate-pulse' : 'bg-red-400'}`} />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {isStagePaid ? "Deliverables Available" : "Pay to Access Files"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Awaiting Upload
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Refund Button */}
                                                {(stage.status === "COMPLETED" || stage.status === "IN_PROGRESS") && (
                                                    <button
                                                        onClick={() => handleRequestRefundClick(stage)}
                                                        className="inline-flex items-center gap-2 text-[10px] font-black text-red-600 hover:text-red-700 transition-all bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm active:scale-95"
                                                    >
                                                        <RefreshCcw className="w-3 h-3" />
                                                        REQUEST REFUND
                                                    </button>
                                                )}

                                                {/* Pay Button for Installments */}
                                                {!isLumpSum && !isStagePaid && canPayStage && (
                                                    <button
                                                        onClick={() => handlePay(stage.id, stage.name, stageAmount)}
                                                        disabled={isCreatingCheckout}
                                                        className="inline-flex items-center gap-2 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 transition-all px-4 py-2 rounded-xl border border-blue-500 shadow-sm active:scale-95 disabled:opacity-50"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        PAY ${stageAmount?.toLocaleString()}
                                                    </button>
                                                )}

                                                {/* View Files Button */}
                                                {stage.driveLink && (
                                                    <a
                                                        href={isStagePaid ? stage.driveLink : undefined}
                                                        target={isStagePaid ? "_blank" : undefined}
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => {
                                                            if (!isStagePaid) {
                                                                e.preventDefault();
                                                                toast.error(isLumpSum ? "Please complete full payment to access files" : "Please pay for this phase to access files");
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-2 text-xs font-black transition-all px-4 py-2 rounded-xl border shadow-sm active:scale-95 ${isStagePaid
                                                            ? 'text-blue-600 hover:text-blue-800 bg-blue-50 border-blue-100 hover:gap-3'
                                                            : 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {isStagePaid ? <ExternalLink className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                                                        VIEW FILES
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Meetings Section */}
                    {meetings.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Scheduled Meetings</h4>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="space-y-3 mb-6">
                                {meetings.map((meeting: any) => {
                                    const isRequest = meeting.meetingUrl === "https://pending.request";
                                    return (
                                        <div key={meeting.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isRequest ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                        <VideoIcon className={`w-5 h-5 ${isRequest ? 'text-amber-600' : 'text-emerald-600'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="text-sm font-bold text-gray-900">{meeting.title}</h5>
                                                            {isRequest && (
                                                                <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-amber-200">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(meeting.scheduledAt)}
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(meeting.scheduledAt)}
                                                            </span>
                                                        </div>
                                                        {meeting.sentByUser && !isRequest && (
                                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                                Organized by {meeting.sentByUser.name}
                                                            </span>
                                                        )}
                                                        {meeting.notes && (
                                                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{meeting.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isRequest ? (
                                                    <a
                                                        href={meeting.meetingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        JOIN
                                                    </a>
                                                ) : (
                                                    <div className="px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-tight flex-shrink-0">
                                                        Requested
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                    <div className="hidden sm:flex items-center gap-2 text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Client Project Dashboard</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-10 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-95 hover:shadow-gray-900/40"
                    >
                        Close View
                    </button>
                </div>
            </div>
        </div>

        {/* Refund Flow Modals */}
            <RefundBankDetailsModal
                isOpen={bankModalOpen}
                onClose={() => setBankModalOpen(false)}
                onSubmit={handleBankDetailsSubmit}
            />

            <RefundCauseModal
                isOpen={refundModalOpen}
                onClose={() => {
                    setRefundModalOpen(false);
                    setPendingBankDetails(null);
                }}
                stageName={selectedStageForRefund?.name || ""}
                isLoading={isSubmittingRefund}
                onSubmit={handleRefundSubmit}
            />
        </>
    );
}
