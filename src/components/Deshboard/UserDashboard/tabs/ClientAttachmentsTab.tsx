import { ExternalLink, Link as LinkIcon, FolderOpen, Lock } from "lucide-react";
import type { ProjectAttachment } from "@/redux/api/adminDashboard/attachmentApi";
import { isLumpSum } from "@/utils/paymentPlan";
import { toExternalUrl } from "@/utils/externalUrl";

interface StagePaymentInfo {
    stageId: string;
    stageName: string;
    amount: number;
    paid: boolean;
    /** The PM has marked this phase complete. */
    completed?: boolean;
    canPay: boolean;
    /** Paid *and* completed — the server applies the same rule to the URL. */
    canViewFiles: boolean;
}

interface ClientAttachmentsTabProps {
    project: any;
    attachments: ProjectAttachment[] | undefined;
    /** Payment status for this project, from GET /payments/status/:id. */
    paymentInfo?: {
        paymentMethod?: string | null;
        lumpSumPaid?: boolean;
        stages?: StagePaymentInfo[];
    };
    /** Sends the client to the tab where they can settle the outstanding phase. */
    onGoToPayments?: () => void;
}

/**
 * The client's intake uploads are read-only here — they were submitted with the
 * original project request.
 *
 * Final deliverables are published per phase, and a phase's folder opens only
 * when it has been both paid for and completed by the PM. On a by-phase plan
 * that is one phase at a time; on a lump-sum plan the single payment covers
 * every phase, but each still waits on its own completion. The server withholds
 * the URL under the same rule, so these buttons reflect a gate that is actually
 * enforced rather than merely drawn.
 */
export default function ClientAttachmentsTab({
    project,
    attachments,
    paymentInfo,
    onGoToPayments,
}: ClientAttachmentsTabProps) {
    const stages = project.stages || [];

    // "Project Attachment Folder" = links the PM attached to the project.
    const attachmentFolderUrl =
        attachments && attachments.length > 0 ? toExternalUrl(attachments[0].url) : null;

    const lumpSum = isLumpSum({ paymentMethod: paymentInfo?.paymentMethod });
    const paymentByStageId = new Map(
        (paymentInfo?.stages || []).map((s) => [s.stageId, s]),
    );

    const intakeFiles: { label: string; value: string | null }[] = [
        { label: "Property Boundary/Survey Map", value: null },
        { label: "Geotechnical Report/Survey", value: null },
    ];

    const FolderButton = ({
        label,
        url,
        emptyHint,
    }: {
        label: string;
        url: string | null;
        emptyHint: string;
    }) => (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-2">{label}</h4>
            {url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95"
                >
                    <FolderOpen className="w-4 h-4" />
                    Open Folder
                </a>
            ) : (
                <>
                    <button
                        disabled
                        title={emptyHint}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 text-sm font-bold rounded-lg cursor-not-allowed border border-gray-200"
                    >
                        <Lock className="w-4 h-4" />
                        Open Folder
                    </button>
                    <p className="text-xs text-gray-400 mt-1.5">{emptyHint}</p>
                </>
            )}
        </div>
    );

    const PhaseDeliverable = ({ stage, index }: { stage: any; index: number }) => {
        const payment = paymentByStageId.get(stage.id);
        const deliverablesUrl = toExternalUrl(stage.driveLink);

        // A folder needs both halves: the phase paid for AND finished by the
        // PM. `canViewFiles` already carries both, and the server strips the
        // URL under the same rule — requiring both here keeps the button from
        // opening on a stale link if the two ever disagree.
        const paid = payment?.paid ?? false;
        const completed =
            payment?.completed ?? stage.status === "COMPLETED";
        const canView = payment?.canViewFiles ?? (paid && completed);
        const unlocked = !!deliverablesUrl && canView;

        const lockReason = !paid
            ? lumpSum
                ? "Unlocks for every completed phase once the project payment is complete."
                : `Unlocks once the ${stage.name} payment is complete.`
            : !completed
                ? "Unlocks once your project manager completes this phase."
                : "Your project manager has not published this phase's deliverables yet.";

        return (
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            <span className="text-gray-400 mr-1.5">{index + 1}.</span>
                            {stage.name}
                        </p>
                        {payment && payment.amount > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                ${payment.amount.toLocaleString()}
                            </p>
                        )}
                    </div>
                    <span
                        className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full border flex-shrink-0 ${!paid
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : completed
                                ? "bg-green-50 text-green-700 border-green-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                    >
                        {!paid ? "Payment due" : completed ? "Paid" : "In progress"}
                    </span>
                </div>

                {unlocked ? (
                    <a
                        href={deliverablesUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Open Folder
                    </a>
                ) : (
                    <>
                        <button
                            disabled
                            title={lockReason}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-400 text-sm font-bold rounded-lg cursor-not-allowed border border-gray-200"
                        >
                            <Lock className="w-4 h-4" />
                            Open Folder
                        </button>
                        <p className="text-xs text-gray-400 mt-1.5">{lockReason}</p>
                        {!paid && onGoToPayments && (
                            <button
                                onClick={onGoToPayments}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-1.5 cursor-pointer"
                            >
                                Go to payments →
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Files submitted with the original request */}
            <div className="space-y-4 mb-8">
                {intakeFiles.map((f) => (
                    <div key={f.label}>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">{f.label}</label>
                        <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-400 bg-gray-50">
                            {f.value || "No file chosen"}
                        </div>
                    </div>
                ))}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                        Additional Project Photos
                    </label>
                    <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-400 bg-gray-50">
                        No files chosen
                    </div>
                </div>
            </div>

            <FolderButton
                label="Project Attachment Folder"
                url={attachmentFolderUrl}
                emptyHint="Available once your project manager shares project attachments."
            />

            {/* Final deliverables, one folder per phase */}
            <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-1">
                    <h4 className="text-sm font-bold text-gray-900">Final Deliverables</h4>
                    {paymentInfo?.paymentMethod && (
                        <span className="text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 flex-shrink-0">
                            {lumpSum ? "Lump sum" : "By phase"}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    {lumpSum
                        ? "Once the project payment is complete, each phase folder opens as your project manager completes that phase."
                        : "Each phase folder opens once that phase is both paid for and completed."}
                </p>

                {stages.length === 0 ? (
                    <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl">
                        <FolderOpen className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400">
                            Phases appear here once your proposal is accepted.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stages.map((stage: any, index: number) => (
                            <PhaseDeliverable key={stage.id} stage={stage} index={index} />
                        ))}
                    </div>
                )}
            </div>

            {/* Individual attachment links, when present */}
            {attachments && attachments.length > 0 && (
                <>
                    <div className="flex items-center gap-3 mb-4 mt-8">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Shared Links
                        </h4>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {attachments.map((attachment) => (
                            <a
                                key={attachment.id}
                                href={toExternalUrl(attachment.url) ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl border bg-blue-50 border-blue-100 flex items-center justify-center flex-shrink-0">
                                        <LinkIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 truncate">{attachment.title}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </a>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
