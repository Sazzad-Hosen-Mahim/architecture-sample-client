import { useState } from "react";
import {
    DollarSign,
    Users,
    Building2,
    ShieldCheck,
    Archive,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OverheadExpensesModal } from "../overheadModal/OverHeadModal";

const AccountantDesk = () => {

    const [showOverheadModal, setShowOverheadModal] = useState(false);
    return (
        <div className="space-y-6">

            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-2 sm:p-8 shadow-sm space-y-6 sm:space-y-8 flex flex-col">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Global Allocations</h3>
                        <p className="text-xs text-gray-400 font-medium italic">Manage firm expenditures & labor.</p>
                    </div>

                    <div className="space-y-4 md:space-y-0 grid grid-cols-3 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => setShowOverheadModal(true)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                    <Building2 size={16} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Update Overhead</span>
                            </div>
                        </button>

                        <Link to="/dashboard/employees" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <Users size={16} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Update Labor</span>
                                </div>
                            </button>
                        </Link>

                        <Link to="/dashboard/refund-requests" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <DollarSign size={16} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Refund Requests</span>
                                </div>
                            </button>
                        </Link>

                        <Link to="/dashboard/client-users" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Show Users</span>
                                </div>
                            </button>
                        </Link>
                        <Link to="/dashboard/adjust-rates" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Adjust Rates</span>
                                </div>
                            </button>
                        </Link>
                        <Link to="/dashboard/proposals" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <Users size={16} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">All Proposals</span>
                                </div>
                            </button>
                        </Link>

                        <Link to="/dashboard/archived-projects" className="block w-full">
                            <button
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-xl text-gray-900 shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <Archive size={16} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-start cursor-pointer">Archived Projects</span>
                                </div>
                            </button>
                        </Link>
                    </div>
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