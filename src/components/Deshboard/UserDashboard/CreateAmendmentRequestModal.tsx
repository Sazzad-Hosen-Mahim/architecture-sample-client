import { useState } from "react";
import { X, FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface AmendmentRequestForm {
    projectName: string;
    squareFootage: string;
    projectSizeUnit: "sqf" | "sqm";
    budgetRange: string;
    description: string;
}

const EMPTY_FORM: AmendmentRequestForm = {
    projectName: "",
    squareFootage: "",
    projectSizeUnit: "sqf",
    budgetRange: "",
    description: "",
};

interface CreateAmendmentRequestModalProps {
    isOpen: boolean;
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (form: AmendmentRequestForm) => Promise<void> | void;
}

export default function CreateAmendmentRequestModal({
    isOpen,
    isLoading,
    onClose,
    onSubmit,
}: CreateAmendmentRequestModalProps) {
    const [form, setForm] = useState<AmendmentRequestForm>(EMPTY_FORM);

    if (!isOpen) return null;

    const close = () => {
        setForm(EMPTY_FORM);
        onClose();
    };

    const handleSubmit = async () => {
        if (!form.projectName.trim()) {
            toast.error("Please enter a project name");
            return;
        }
        if (!form.description.trim()) {
            toast.error("Please describe the changes you need");
            return;
        }
        await onSubmit({
            ...form,
            projectName: form.projectName.trim(),
            description: form.description.trim(),
            squareFootage: form.squareFootage.trim(),
        });
        setForm(EMPTY_FORM);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                            <FilePlus2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Request an Amendment</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Ask for additional phases or changes to your project
                            </p>
                        </div>
                    </div>
                    <button onClick={close} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.projectName}
                            onChange={(e) => setForm((p) => ({ ...p, projectName: e.target.value }))}
                            placeholder="e.g. Garage Extension"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            Project Area Estimate
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                min="0"
                                value={form.squareFootage}
                                onChange={(e) => setForm((p) => ({ ...p, squareFootage: e.target.value }))}
                                placeholder="e.g. 1200"
                                className="flex-1 px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <select
                                value={form.projectSizeUnit}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        projectSizeUnit: e.target.value as "sqf" | "sqm",
                                    }))
                                }
                                className="px-3 py-2 border border-gray-300 rounded-r-lg bg-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="sqf">Sq Ft</option>
                                <option value="sqm">Sq M</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Budget Range</label>
                        <input
                            type="text"
                            value={form.budgetRange}
                            onChange={(e) => setForm((p) => ({ ...p, budgetRange: e.target.value }))}
                            placeholder="e.g. $250,000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            rows={4}
                            placeholder="Describe the additional work or changes you'd like to make"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <button
                        onClick={close}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                            </>
                        ) : (
                            "Send Request"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
