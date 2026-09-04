import { FolderOpen, Lock } from "lucide-react";
import SharedFolderCard from "@/components/Deshboard/Common/SharedFolderCard";

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
    /** Payment status for this project, from GET /payments/status/:id. */
    paymentInfo?: {
        paymentMethod?: string | null;
        lumpSumPaid?: boolean;
        consultationPaid?: boolean;
        stages?: StagePaymentInfo[];
    };
    /** Sends the client to the tab where they can settle the outstanding phase. */
    onGoToPayments?: () => void;
}

/**
 * The client's Documents tab.
 *
 * Their intake uploads are read-only here — they were submitted with the
 * original project request.
 *
 * Below that is the shared project folder: the architect's links on one side,
 * the client's on the other. The client adds and manages only their own; the
 * architect's are read-only to them, and the server enforces the same rule.
 * The whole card unlocks once the consultation fee is paid, the same gate the
 * meetings tab uses.
 *
 * Deliverables used to be published as one Drive link per phase. They are
 * posted to the architect's half of the shared folder now, so there is one
 * place to look rather than one per phase.
 */
export default function ClientAttachmentsTab({
    project,
    paymentInfo,
    onGoToPayments,
}: ClientAttachmentsTabProps) {
    // Mirrors the meetings tab: default to unlocked when payment status hasn't
    // loaded yet — a lock that flashes at a client who already paid is worse
    // than a moment of nothing, and the server rejects the request either way.
    const consultationPaid = paymentInfo
        ? (paymentInfo.consultationPaid ?? !!project.consultationPaymentId)
        : true;

    const intakeFiles: { label: string; value: string | null }[] = [
        { label: "Property Boundary/Survey Map", value: null },
        { label: "Geotechnical Report/Survey", value: null },
    ];

    return (
        <>
            {/* Files submitted with the original request */}
            <div className="space-y-4 mb-8">
                {intakeFiles.map((f) => (
                    <div key={f.label}>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            {f.label}
                        </label>
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

            {/* ─── The shared project folder, consultation-gated ─── */}
            {!consultationPaid ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl mb-6">
                    <Lock className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400">
                        The project folder unlocks once your consultation fee is paid.
                    </p>
                    {onGoToPayments && (
                        <button
                            onClick={onGoToPayments}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                            Go to payments →
                        </button>
                    )}
                </div>
            ) : project.id ? (
                <div className="mb-6">
                    <SharedFolderCard projectId={project.id} side="CLIENT" />
                </div>
            ) : (
                <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl mb-6">
                    <FolderOpen className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400">
                        The project folder appears once your project is set up.
                    </p>
                </div>
            )}
        </>
    );
}
