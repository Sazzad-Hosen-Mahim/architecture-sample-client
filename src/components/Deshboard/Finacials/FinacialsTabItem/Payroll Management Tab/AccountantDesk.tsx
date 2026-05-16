import { useState } from "react";
import {
    useGetBillingRateQuery,
    useSetBillingRateMutation
} from "@/redux/api/financialApi";
import {
    DollarSign,
    Settings,
    TrendingUp,
    Users,
    Building2,
    ArrowRight,
    ShieldCheck,
    // Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { OverheadExpensesModal } from "../overheadModal/OverHeadModal";

const AccountantDesk = () => {
    const { data: billingRateData, isLoading } = useGetBillingRateQuery();
    const [setBillingRate, { isLoading: isUpdating }] = useSetBillingRateMutation();

    const [newRate, setNewRate] = useState<string>("");
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [showOverheadModal, setShowOverheadModal] = useState(false);

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

    if (isLoading) return <div className="p-12 text-center text-gray-400">Loading firm controls...</div>;

    return (
        <div className="space-y-6">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <ShieldCheck size={180} />
                </div>
                <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                        <ShieldCheck size={12} /> Firm Administrator Access
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                        Accountant's Central <br /> <span className="text-gray-400">Control Desk</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        Centralized management for firm-wide billing rates, labor allocations, and overhead expenditures. Changes here directly impact project burn calculations and firm profitability.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Billing Rate Control */}
                <div className="md:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
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
                            <div className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900">
                                ${billingRateData?.billingRate || 0}<span className="text-lg text-gray-400">/hr</span>
                            </div>
                        </div>

                        {!isEditingRate ? (
                            <button
                                onClick={() => {
                                    setIsEditingRate(true);
                                    setNewRate(String(billingRateData?.billingRate || ""));
                                }}
                                className="mb-1 text-xs font-black uppercase text-blue-600 hover:text-blue-700 transition-colors underline decoration-2 underline-offset-4"
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
                                <Button onClick={handleUpdateRate} disabled={isUpdating} className="h-9 rounded-xl px-4 bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest">
                                    Update
                                </Button>
                                <Button variant="ghost" onClick={() => setIsEditingRate(false)} className="h-9 rounded-xl px-3 text-[10px] font-bold uppercase">
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
                        <Settings className="w-5 h-5 text-gray-400 mt-1" />
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

                {/* Quick Actions Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8 flex flex-col">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Global Allocations</h3>
                        <p className="text-xs text-gray-400 font-medium italic">Manage firm expenditures & labor.</p>
                    </div>

                    <div className="space-y-4 flex-1">
                        <button
                            onClick={() => setShowOverheadModal(true)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                    <Building2 size={18} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Update Overhead</span>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                        </button>

                        <Link to="/dashboard/employees" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <Users size={18} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Update Labor</span>
                                </div>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                            </button>
                        </Link>

                        <Link to="/dashboard/refund-requests" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <DollarSign size={18} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Refund Requests</span>
                                </div>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                            </button>
                        </Link>

                        <Link to="/dashboard/client-users" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Show Users</span>
                                </div>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                            </button>
                        </Link>
                    </div>

                    {/* <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Plus size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">One-Time Costs Support Active</span>
                        </div>
                    </div> */}
                </div>
            </div>

            <OverheadExpensesModal
                open={showOverheadModal}
                onOpenChange={setShowOverheadModal}
            />
        </div>
    );
};

export default AccountantDesk;