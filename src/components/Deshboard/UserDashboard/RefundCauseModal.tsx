import { useState } from "react";
import { X, AlertCircle, FileText } from "lucide-react";

interface RefundCauseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { refundCause: string; refundDescription: string }) => void;
    stageName: string;
    isLoading?: boolean;
}

export default function RefundCauseModal({ isOpen, onClose, onSubmit, stageName, isLoading }: RefundCauseModalProps) {
    const [refundCause, setRefundCause] = useState("");
    const [refundDescription, setRefundDescription] = useState("");
    const [errors, setErrors] = useState<{ refundCause?: string; refundDescription?: string }>({});

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!refundCause.trim()) newErrors.refundCause = "Refund cause is required";
        if (!refundDescription.trim()) newErrors.refundDescription = "Please provide a brief description";
        if (refundDescription.trim().length > 0 && refundDescription.trim().length < 10) {
            newErrors.refundDescription = "Please provide at least 10 characters";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({ refundCause, refundDescription });
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Request Refund</h3>
                        <p className="text-xs text-red-200 mt-0.5">Phase: {stageName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-red-200" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            Your refund request will be reviewed by the financial manager. You'll be notified once a decision has been made.
                        </p>
                    </div>

                    {/* Refund Cause */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                            Refund Cause *
                        </label>
                        <input
                            type="text"
                            value={refundCause}
                            onChange={(e) => {
                                setRefundCause(e.target.value);
                                if (errors.refundCause) setErrors(prev => ({ ...prev, refundCause: "" }));
                            }}
                            placeholder="e.g., Unsatisfied with design quality"
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.refundCause ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all`}
                        />
                        {errors.refundCause && <p className="text-xs text-red-500 mt-1 font-medium">{errors.refundCause}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                            Explain in Brief *
                        </label>
                        <textarea
                            value={refundDescription}
                            onChange={(e) => {
                                setRefundDescription(e.target.value);
                                if (errors.refundDescription) setErrors(prev => ({ ...prev, refundDescription: "" }));
                            }}
                            placeholder="Please explain why you're requesting a refund for this phase..."
                            rows={4}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.refundDescription ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none`}
                        />
                        {errors.refundDescription && <p className="text-xs text-red-500 mt-1 font-medium">{errors.refundDescription}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? "Submitting..." : "Submit Refund Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
