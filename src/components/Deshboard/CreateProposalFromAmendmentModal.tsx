import { useEffect, useState } from "react";
import { X, FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_PLAN_OPTIONS, type PaymentPlan } from "@/utils/paymentPlan";

export interface AmendmentProposalForm {
    name: string;
    description: string;
    budgetRange: string;
    expectedTimeline: string;
    paymentType: PaymentPlan;
    notes: string;
}

const BUDGET_OPTIONS = [
    "Under $100k",
    "$100k-$250k",
    "$250k-$500k",
    "$500k-$1M",
    "Over $1M",
];

interface CreateProposalFromAmendmentModalProps {
    isOpen: boolean;
    isLoading?: boolean;
    amendment: any | null;
    onClose: () => void;
    onSubmit: (form: AmendmentProposalForm) => Promise<void> | void;
}

export default function CreateProposalFromAmendmentModal({
    isOpen,
    isLoading,
    amendment,
    onClose,
    onSubmit,
}: CreateProposalFromAmendmentModalProps) {
    const [form, setForm] = useState<AmendmentProposalForm>({
        name: "",
        description: "",
        budgetRange: "",
        expectedTimeline: "",
        paymentType: "PHASE_COMPLETION",
        notes: "",
    });

    // Seed from the client's request so the PM only edits what differs.
    useEffect(() => {
        if (amendment) {
            setForm((prev) => ({
                ...prev,
                name: amendment.projectName || "",
                description: amendment.description || "",
                budgetRange: amendment.budgetRange || "",
            }));
        }
    }, [amendment]);

    if (!isOpen || !amendment) return null;

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error("Please enter a proposal name");
            return;
        }
        await onSubmit({ ...form, name: form.name.trim() });
    };

    const areaEstimate = amendment.squareFootage
        ? `${amendment.squareFootage} ${amendment.projectSizeUnit === "sqm" ? "sq m" : "sq ft"}`
        : null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                            <FilePlus2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Create Proposal from Amendment</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{amendment.projectName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-4 overflow-y-auto">
                    {/* What the client asked for */}
                    <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-3 space-y-1">
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                            Client Request
                        </p>
                        <p className="text-xs text-gray-700">{amendment.description}</p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            {areaEstimate && (
                                <span className="text-[11px] text-gray-600">
                                    <strong>Area:</strong> {areaEstimate}
                                </span>
                            )}
                            {amendment.budgetRange && (
                                <span className="text-[11px] text-gray-600">
                                    <strong>Budget:</strong> {amendment.budgetRange}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            Proposal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Budget Range</label>
                            <select
                                value={form.budgetRange}
                                onChange={(e) => setForm((p) => ({ ...p, budgetRange: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select</option>
                                {BUDGET_OPTIONS.map((b) => (
                                    <option key={b} value={b}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                Expected Timeline
                            </label>
                            <input
                                type="text"
                                value={form.expectedTimeline}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, expectedTimeline: e.target.value }))
                                }
                                placeholder="e.g. 6-12 months"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Replaces the old tax rate field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            Payment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.paymentType}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    paymentType: e.target.value as AmendmentProposalForm["paymentType"],
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {PAYMENT_PLAN_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                            </>
                        ) : (
                            "Create Proposal"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
