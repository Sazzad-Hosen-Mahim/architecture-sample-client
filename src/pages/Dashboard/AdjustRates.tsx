import { useEffect, useState } from "react";
import { DollarSign, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Info,
    Settings,
    TrendingUp,
    // Plus
} from "lucide-react";
import {
    useGetConsultationFeeQuery,
    useUpdateConsultationFeeMutation,
} from "@/redux/api/adminDashboard/siteSettingsApi";
import {
    useGetBillingRateQuery,
    useSetBillingRateMutation
} from "@/redux/api/financialApi";
import { Loader } from "@/components/ui/loader";

const ALLOWED_ROLES = ["SUPER_ADMIN", "PROJECT_MANAGER", "FINANCE"];

const AdjustRates = () => {
    const currentUser = useAppSelector(selectCurrentUser);
    const canAdjust = ALLOWED_ROLES.includes(currentUser?.role || "");

    const { data, isLoading } = useGetConsultationFeeQuery(undefined, {
        skip: !canAdjust,
    });
    const [updateFee, { isLoading: isSaving }] = useUpdateConsultationFeeMutation();

    const [feeInput, setFeeInput] = useState("");

    useEffect(() => {
        if (data?.data?.feeUsd !== undefined) {
            setFeeInput(String(data.data.feeUsd));
        }
    }, [data]);

    const { data: billingRateData, } = useGetBillingRateQuery();
    const [setBillingRate, { isLoading: isUpdating }] = useSetBillingRateMutation();

    const [newRate, setNewRate] = useState<string>("");
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [isEditingFee, setIsEditingFee] = useState(false);
    // const [showOverheadModal, setShowOverheadModal] = useState(false);

    const handleUpdateRate = async () => {
        const rate = parseFloat(newRate);
        if (isNaN(rate) || rate <= 0) {
            toast.error("Please enter a valid billing rate");
            return;
        }

        try {
            await setBillingRate(rate).unwrap();
            toast.success("Firm billing rate updated");
            setIsEditingRate(false);
            setNewRate("");
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to update billing rate");
        }
    };

    if (isLoading) return <Loader fullScreen={false} />;

    if (!canAdjust) {
        return (
            <div className="max-w-xl mx-auto mt-16 p-8 text-center border border-dashed border-gray-200 rounded-xl">
                <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
                <p className="text-sm text-gray-500 mt-1">
                    You don't have permission to adjust rates.
                </p>
            </div>
        );
    }

    const currentFee = data?.data?.feeUsd;
    const parsedInput = parseFloat(feeInput);
    const hasChanges =
        Number.isFinite(parsedInput) &&
        parsedInput > 0 &&
        parsedInput !== currentFee;

    const handleSave = async () => {
        if (!hasChanges) return;
        try {
            const result = await updateFee({ feeUsd: parsedInput }).unwrap();
            setFeeInput(String(result.data.feeUsd));
            setIsEditingFee(false);
            toast.success("Consultation fee updated successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update consultation fee");
        }
    };

    return (
        <div className="max-w-5xl mx-auto my-3 px-4 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">Adjust Rates</h1>
                <p className="text-sm text-gray-500">
                    Set the firm-wide billing rate and the consultation fee clients pay before submitting a new project request.
                </p>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Global Project Billing Rate</h3>
                        <p className="text-xs text-gray-400 font-medium italic">Applied to all project hours for client billing calculations.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Rate</span>
                        <div className="text-3xl sm:text-5xl font-black text-gray-900">
                            ${billingRateData?.billingRate || 0}<span className="text-lg text-gray-400">/hr</span>
                        </div>
                    </div>

                    {!isEditingRate ? (
                        <button
                            onClick={() => {
                                setIsEditingRate(true);
                                setNewRate(String(billingRateData?.billingRate || ""));
                            }}
                            className="mb-1 text-xs cursor-pointer font-black uppercase text-blue-600 hover:text-blue-700 transition-colors underline decoration-2 underline-offset-4"
                        >
                            Adjust Rate
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 mb-1 animate-in slide-in-from-left-2 duration-200">
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <Input
                                    type="number"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    className="w-28 pl-8 h-9 rounded-xl font-bold border-blue-200 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <Button onClick={handleUpdateRate} disabled={isUpdating} className="h-9 rounded-xl px-4 bg-black text-white cursor-pointer hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest">
                                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update"}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsEditingRate(false)} className="h-9 cursor-pointer rounded-xl px-3 text-[10px] font-bold uppercase">
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
                    <Settings className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-xs text-gray-600 font-bold leading-relaxed">
                            This billing rate is the hourly amount charged to clients per hour of project work.
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium italic">
                            Note: This value overrides employee-specific hourly rates in the Project Financial Tracking logic to ensure consistent firm-wide billing standards.
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Consultation Fee</h3>
                        <p className="text-xs text-gray-400 font-medium italic">Charged to clients before they can submit a new project request.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Fee</span>
                        <div className="text-3xl sm:text-5xl font-black text-gray-900">
                            ${currentFee ?? 250}<span className="text-lg text-gray-400">/consultation</span>
                        </div>
                    </div>

                    {!isEditingFee ? (
                        <button
                            onClick={() => {
                                setIsEditingFee(true);
                                setFeeInput(String(currentFee ?? ""));
                            }}
                            className="mb-1 text-xs cursor-pointer font-black uppercase text-blue-600 hover:text-blue-700 transition-colors underline decoration-2 underline-offset-4"
                        >
                            Adjust Fee
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 mb-1 animate-in slide-in-from-left-2 duration-200">
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <Input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={feeInput}
                                    onChange={(e) => setFeeInput(e.target.value)}
                                    className="w-28 pl-8 h-9 rounded-xl font-bold border-blue-200 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving}
                                className="h-9 rounded-xl px-4 cursor-pointer bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update"}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsEditingFee(false);
                                    setFeeInput(String(currentFee ?? ""));
                                }}
                                className="h-9 rounded-xl px-3 cursor-pointer text-[10px] font-bold uppercase"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
                    <Info className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-xs text-gray-600 font-bold leading-relaxed">
                            This is the one-time fee a client pays to book their initial consultation.
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium italic">
                            Note: Changes apply to new project requests only. Consultations already paid for are not affected.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdjustRates;
