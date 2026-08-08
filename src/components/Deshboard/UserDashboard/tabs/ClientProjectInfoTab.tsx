import { useMemo } from "react";
import {
    CheckCircle2,
    Clock,
    ExternalLink,
    Package,
    MapPin,
    Mail,
    Phone,
    Building2,
    User,
    Calendar,
    DollarSign,
    CreditCard,
    RefreshCcw,
    ArrowRight,
} from "lucide-react";
import { toExternalUrl } from "@/utils/externalUrl";
import { toast } from "sonner";
import { getProjectProgress } from "@/utils/projectProgress";
import { isLumpSum, paymentPlanDescription } from "@/utils/paymentPlan";

interface ClientProjectInfoTabProps {
    project: any;
    paymentInfo: any;
    /** Jumps the user to the Meetings & Payment tab, where all billing lives. */
    onGoToPayments: () => void;
    /** Opens the refund flow for a whole contract. */
    onRequestRefund: (contract: any) => void;
    /** Phases with an approved refund - dropped from the view entirely. */
    refundedStageIds?: Set<string>;
}

const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getDeadlineColor = (dateStr: string) => {
    const days = getDaysUntil(dateStr);
    if (days < 0) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 3) return "text-red-700 bg-red-50 border-red-100";
    if (days <= 7) return "text-amber-700 bg-amber-50 border-amber-100";
    return "text-gray-500 bg-gray-50 border-gray-100";
};

export default function ClientProjectInfoTab({
    project,
    paymentInfo,
    onGoToPayments,
    onRequestRefund,
    refundedStageIds,
}: ClientProjectInfoTabProps) {
    const lumpSum = isLumpSum(paymentInfo);
    const isPaidAll = paymentInfo?.lumpSumPaid;

    // Memoised so the contract grouping below is not recomputed every render.
    // Refunded phases are excluded up front, so they drop out of the phase
    // list, the progress calculation and the refundable set together.
    const stages = useMemo(
        () =>
            (project.stages || []).filter((s: any) => !refundedStageIds?.has(s.id)),
        [project.stages, refundedStageIds]
    );
    const completedStages = stages.filter((s: any) => s.status === "COMPLETED");
    const progress = getProjectProgress(project.status, completedStages.length, stages.length);

    // Phases belong to a contract - the original proposal or an amendment.
    // Grouping keeps each contract's phases together instead of interleaving
    // them, matching the Meetings & Payment tab.
    const contractGroups = useMemo(() => {
        const ORIGINAL_KEY = "__original__";
        const proposals = project.proposals || [];
        const byId = new Map(proposals.map((p: any) => [p.id, p]));
        const groups = new Map<string, any>();

        stages.forEach((stage: any) => {
            const key =
                stage.proposalId && byId.has(stage.proposalId) ? stage.proposalId : ORIGINAL_KEY;
            if (!groups.has(key)) {
                const proposal: any = byId.get(key);
                groups.set(key, {
                    key,
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
            .map((group) => ({
                ...group,
                // Only phases the client has paid for can be refunded. On a
                // lump-sum plan everything is paid, so every phase qualifies.
                refundablePhases: group.stages
                    .map((stage: any) => {
                        const info = paymentInfo?.stages?.find(
                            (s: any) => s.stageId === stage.id
                        );
                        const paid = isPaidAll || info?.paid;
                        return paid
                            ? { id: stage.id, name: stage.name, amount: info?.amount || 0 }
                            : null;
                    })
                    .filter(Boolean),
            }));
    }, [stages, project, paymentInfo, isPaidAll]);

    const fullClientName = [project.clientFirstName, project.clientMiddleName, project.clientLastName]
        .filter(Boolean)
        .join(" ");
    const projectAddress = [
        project.projectStreetAddress,
        project.projectCity,
        project.projectState,
        project.projectCountry,
    ]
        .filter(Boolean)
        .join(", ");
    const clientAddress = [project.streetAddress, project.city, project.state, project.country]
        .filter(Boolean)
        .join(", ");

    return (
        <>
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
                                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                                    Architectural Style
                                </span>
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
                                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                                    Sustainability Goals
                                </span>
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
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                Payment Strategy
                            </h4>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">
                            {paymentPlanDescription(paymentInfo)}
                        </p>
                        {paymentInfo?.consultationPaid && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase rounded border border-green-100 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Consultation Fee Paid
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                {lumpSum ? (
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
                                        <RefreshCcw size={12} /> By Phase Completion
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* All billing actions live in the Meetings & Payment tab. */}
                        <button
                            onClick={onGoToPayments}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-95"
                        >
                            Go to Payments
                            <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Overview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 mb-8 border border-blue-100/50 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1">
                                Current Progress
                            </span>
                            <span className="text-sm font-medium text-blue-700">
                                Completion rate for all project phases
                            </span>
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
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Project Workflow Phases
                </h4>
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
                <div className="space-y-8 mb-8">
                    {contractGroups.map((group: any) => (
                        <div key={group.key} className="space-y-5">
                            {/* Contract heading, so it is clear which contract
                            each phase belongs to */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <h5 className="text-sm font-black text-gray-900">{group.title}</h5>
                                {group.isAmendment && (
                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-black rounded border border-purple-100 uppercase tracking-tighter">
                                        Amendment
                                    </span>
                                )}
                                {group.proposalNumber && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {group.proposalNumber}
                                    </span>
                                )}
                                <div className="flex-1 h-px bg-gray-100" />
                                {group.refundablePhases.length > 0 && (
                                    <button
                                        onClick={() => onRequestRefund(group)}
                                        className="inline-flex items-center cursor-pointer gap-1.5 text-[10px] font-black text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 active:scale-95 flex-shrink-0"
                                    >
                                        <RefreshCcw className="w-3 h-3" />
                                        REQUEST REFUND
                                    </button>
                                )}
                            </div>

                            {group.stages.map((stage: any, idx: number) => {
                                const isCompleted = stage.status === "COMPLETED";
                                const stagePaymentInfo = paymentInfo?.stages?.find((s: any) => s.stageId === stage.id);
                                const isStagePaid = isPaidAll || stagePaymentInfo?.paid;
                                const canPayStage = stagePaymentInfo?.canPay;
                                const stageAmount = stagePaymentInfo?.amount;

                                return (
                                    <div
                                        key={stage.id}
                                        className={`group relative border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${isCompleted
                                                ? "bg-green-50/30 border-green-100 shadow-green-900/5"
                                                : "bg-white border-gray-200 shadow-gray-200/40"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${isCompleted
                                                            ? "bg-green-100 text-green-600 border-green-200"
                                                            : "bg-amber-50 text-amber-600 border-amber-100"
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    ) : (
                                                        <Clock className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                            Phase {idx + 1}
                                                        </span>
                                                        <span
                                                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${isCompleted
                                                                    ? "bg-green-100/50 text-green-700 border-green-200/50"
                                                                    : "bg-amber-100/50 text-amber-700 border-amber-200/50"
                                                                }`}
                                                        >
                                                            {stage.status}
                                                        </span>
                                                        {stage.externalDeadline && !isCompleted && (
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${getDeadlineColor(
                                                                    stage.externalDeadline
                                                                )}`}
                                                            >
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                Deadline:{" "}
                                                                {new Date(stage.externalDeadline).toLocaleDateString("en-US", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                                {getDaysUntil(stage.externalDeadline) < 0 && " (OVERDUE)"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5
                                                        className={`font-bold text-base leading-tight ${isCompleted ? "text-green-900" : "text-gray-900"
                                                            }`}
                                                    >
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
                                                <span className={isCompleted ? "text-green-600" : "text-blue-600"}>
                                                    {stage.progress || 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-in-out ${isCompleted
                                                            ? "bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20"
                                                            : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20"
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
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${isStagePaid ? "bg-blue-500 animate-pulse" : "bg-red-400"
                                                                }`}
                                                        />
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
                                                {!lumpSum && !isStagePaid && canPayStage && (
                                                    <button
                                                        onClick={onGoToPayments}
                                                        className="inline-flex items-center gap-2 text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all px-4 py-2 rounded-xl border border-blue-100 shadow-sm active:scale-95"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        ${stageAmount?.toLocaleString()} DUE
                                                    </button>
                                                )}

                                                {stage.driveLink && (
                                                    <a
                                                        href={isStagePaid ? toExternalUrl(stage.driveLink) ?? undefined : undefined}
                                                        target={isStagePaid ? "_blank" : undefined}
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => {
                                                            if (!isStagePaid) {
                                                                e.preventDefault();
                                                                toast.error(
                                                                    lumpSum
                                                                        ? "Please complete full payment to access files"
                                                                        : "Please pay for this phase to access files"
                                                                );
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-2 text-xs font-black transition-all px-4 py-2 rounded-xl border shadow-sm active:scale-95 ${isStagePaid
                                                                ? "text-blue-600 hover:text-blue-800 bg-blue-50 border-blue-100 hover:gap-3"
                                                                : "text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed"
                                                            }`}
                                                    >
                                                        {isStagePaid ? (
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                        )}
                                                        VIEW FILES
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
