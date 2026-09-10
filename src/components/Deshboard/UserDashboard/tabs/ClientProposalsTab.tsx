import { useState } from "react";
import { Eye, FileSignature, FilePlus2, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import ContractReviewModal from "@/components/Deshboard/ContractReviewModal";
import ViewProposalDetailsModal from "@/components/Modal/ViewProposalDetailsModal";
import CreateAmendmentRequestModal, {
    AmendmentRequestForm,
} from "../CreateAmendmentRequestModal";
import { useCreateAmendmentMutation } from "@/redux/api/amendmentApi";

interface ClientProposalsTabProps {
    project: any;
    amendments: any[];
    /** Passed through to the details modal so it can mark phases as paid. */
    paymentInfo?: any;
}

const StatusPill = ({ status }: { status: string }) => {
    const configs: Record<string, { label: string; style: string; icon: any }> = {
        ACCEPTED: { label: "Accepted", style: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
        SENT: { label: "Sent", style: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
        VIEWED: { label: "Viewed", style: "bg-purple-100 text-purple-700 border-purple-200", icon: Eye },
        REJECTED: { label: "Rejected", style: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
        EXPIRED: { label: "Expired", style: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
    };
    const config = configs[status] || {
        label: status,
        style: "bg-gray-100 text-gray-700 border-gray-200",
        icon: Clock,
    };
    const Icon = config.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.style}`}
        >
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

/**
 * Amendment proposals are numbered off their parent so they read as a series:
 * PROP-2026-0014 -> PROP-2026-0014-AMD-001
 */
const amendmentLabel = (parentNumber: string | undefined, ownNumber: string, index: number) => {
    if (!parentNumber) return ownNumber;
    return `${parentNumber}-AMD-${String(index + 1).padStart(3, "0")}`;
};

export default function ClientProposalsTab({ project, amendments, paymentInfo }: ClientProposalsTabProps) {
    const [detailsProposal, setDetailsProposal] = useState<any>(null);
    const [contractProposalId, setContractProposalId] = useState<string>("");
    const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);

    const [createAmendment, { isLoading: isCreatingAmendment }] = useCreateAmendmentMutation();

    // A DRAFT lives only in the PM's dashboard until it is sent.
    const visibleProposals = (project.proposals || []).filter((p: any) => p.status !== "DRAFT");

    const baseProposals = visibleProposals.filter((p: any) => p.proposalType !== "AMENDMENT");
    const amendmentProposals = visibleProposals.filter((p: any) => p.proposalType === "AMENDMENT");

    const originalProposal = baseProposals[0];

    const handleRequestAmendment = async (form: AmendmentRequestForm) => {
        if (!originalProposal?.id) {
            toast.error("You need an accepted proposal before requesting an amendment");
            return;
        }
        try {
            await createAmendment({
                proposalId: originalProposal.id,
                projectName: form.projectName,
                description: form.description,
                squareFootage: form.squareFootage || undefined,
                projectSizeUnit: form.projectSizeUnit,
                budgetRange: form.budgetRange || undefined,
            }).unwrap();
            toast.success("Amendment request sent! Your project manager will review it.");
            setIsAmendmentOpen(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to send amendment request");
        }
    };

    const ProposalCard = ({
        proposal,
        displayNumber,
    }: {
        proposal: any;
        displayNumber: string;
    }) => (
        <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        {proposal.status === "ACCEPTED" ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                        ) : (
                            <FileText className="w-4.5 h-4.5 text-blue-600" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h5 className="text-sm font-bold text-gray-900 truncate">
                            Proposal {displayNumber}
                        </h5>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            #{displayNumber}
                            {proposal.createdAt &&
                                ` • ${new Date(proposal.createdAt).toLocaleDateString()}`}
                        </p>
                    </div>
                </div>
                <StatusPill status={proposal.status} />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-bold text-gray-900">
                    Amount:{" "}
                    <span className="text-gray-700">
                        ${Number(proposal.totalAmount || 0).toLocaleString()}
                    </span>
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDetailsProposal(proposal)}
                        className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors active:scale-95"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                    </button>
                    <button
                        onClick={() => setContractProposalId(proposal.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors active:scale-95"
                    >
                        <FileSignature className="w-3.5 h-3.5" />
                        View Contract
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* ─── Original Proposal ─── */}
            <div className="flex items-center gap-3 mb-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Original Proposal
                </h4>
                <div className="flex-1 h-px bg-gray-100" />
            </div>

            {baseProposals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-8">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">No proposals yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Your project manager will send a proposal once your inquiry is reviewed.
                    </p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {baseProposals.map((p: any) => (
                        <ProposalCard key={p.id} proposal={p} displayNumber={p.proposalNumber} />
                    ))}
                </div>
            )}

            {/* ─── Proposal Amendments ─── */}
            <div className="flex items-center gap-3 mb-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Proposal Amendments
                </h4>
                <div className="flex-1 h-px bg-gray-100" />
                <button
                    onClick={() => {
                        if (!originalProposal) {
                            toast.error("You need a proposal before requesting an amendment");
                            return;
                        }
                        if (originalProposal.status !== "ACCEPTED") {
                            toast.error("You can request amendments once your proposal is accepted");
                            return;
                        }
                        setIsAmendmentOpen(true);
                    }}
                    className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    Request Amendment
                </button>
            </div>

            {amendmentProposals.length === 0 ? (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-6">
                    <p className="text-gray-500 font-semibold text-sm">No amendments yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Request one if you need extra phases or changes to your project.
                    </p>
                </div>
            ) : (
                <div className="space-y-3 mb-6">
                    {amendmentProposals.map((p: any, idx: number) => (
                        <ProposalCard
                            key={p.id}
                            proposal={p}
                            displayNumber={amendmentLabel(originalProposal?.proposalNumber, p.proposalNumber, idx)}
                        />
                    ))}
                </div>
            )}

            {/* Pending amendment requests that have not become proposals yet */}
            {amendments.filter((a: any) => !a.amendmentProposalId).length > 0 && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Pending Requests
                        </h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-2 mb-6">
                        {amendments
                            .filter((a: any) => !a.amendmentProposalId)
                            .map((a: any) => (
                                <div
                                    key={a.id}
                                    className="flex items-center justify-between gap-3 bg-amber-50/50 border border-amber-100 rounded-xl p-4"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{a.projectName}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            Requested {new Date(a.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-white text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-widest flex-shrink-0">
                                        {a.status}
                                    </span>
                                </div>
                            ))}
                    </div>
                </>
            )}

            {/* ─── Sub-modals ─── */}
            {detailsProposal && (
                <ViewProposalDetailsModal
                    proposal={detailsProposal}
                    paymentInfo={paymentInfo}
                    onClose={() => setDetailsProposal(null)}
                />
            )}

            {contractProposalId && (
                <ContractReviewModal
                    isOpen={!!contractProposalId}
                    proposalId={contractProposalId}
                    onClose={() => setContractProposalId("")}
                />
            )}

            <CreateAmendmentRequestModal
                isOpen={isAmendmentOpen}
                isLoading={isCreatingAmendment}
                onClose={() => setIsAmendmentOpen(false)}
                onSubmit={handleRequestAmendment}
            />
        </>
    );
}
