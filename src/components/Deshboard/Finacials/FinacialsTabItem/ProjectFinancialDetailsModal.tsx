"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGetProjectFinancialDetailsQuery } from "@/redux/api/financialApi";
import { Loader2, DollarSign, Clock, Users, BarChart3, TrendingUp, Info } from "lucide-react";

interface ProjectFinancialDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
};

const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
};

export default function ProjectFinancialDetailsModal({
    open,
    onOpenChange,
    projectId,
}: ProjectFinancialDetailsModalProps) {
    const { data: details, isLoading } = useGetProjectFinancialDetailsQuery(projectId, { skip: !open });

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px] p-20 flex justify-center bg-white">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                </DialogContent>
            </Dialog>
        );
    }

    if (!details) return null;

    const profitMargin = details.projectCost > 0 ? (details.profit / details.projectCost) * 100 : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] bg-white text-black p-0 overflow-hidden font-semibold">
                <DialogHeader className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black tracking-tight text-gray-900">
                                {details.projectName}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                                Client: {details.clientName}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Contract Value</div>
                            <div className="text-3xl font-black text-blue-600">{formatCurrency(details.projectCost)}</div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 max-h-[75vh] overflow-y-auto space-y-10">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                                <Users size={14} className="group-hover:text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Labor Cost</span>
                            </div>
                            <div className="text-xl font-black">{formatCurrency(details.totalEmployeeCost)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                                <BarChart3 size={14} className="group-hover:text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Avg Overhead</span>
                            </div>
                            <div className="text-xl font-black">{formatCurrency(details.averageOverhead)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                                <DollarSign size={14} className="group-hover:text-red-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Total cost</span>
                            </div>
                            <div className="text-xl font-black">{formatCurrency(details.totalProjectCost)}</div>
                        </div>
                        <div className={`p-4 rounded-2xl border space-y-2 transition-all duration-300 shadow-lg ${details.profit >= 0 ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                            <div className="flex items-center gap-2 opacity-60">
                                <TrendingUp size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Profit</span>
                            </div>
                            <div className="text-xl font-black">{formatCurrency(details.profit)}</div>
                        </div>
                    </div>

                    {/* Phases Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                            Project Phases & Progress
                        </h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4">Phase Name</th>
                                        <th className="px-6 py-4">Allocated Price</th>
                                        <th className="px-6 py-4">Tracked Time</th>
                                        <th className="px-6 py-4">Assigned Manager</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {details.phases.map((phase: any) => (
                                        <tr key={phase.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-bold text-gray-900">{phase.name}</td>
                                            <td className="px-6 py-4 text-blue-600 font-black">{formatCurrency(phase.price)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock size={12} className="text-gray-400" />
                                                    {formatDuration(phase.accumulatedTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {phase.assignedTo?.name || "Unassigned"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                    phase.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                                    phase.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                                }`}>
                                                    {phase.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Employee Labor Breakdown */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-black pl-3">
                            Direct Labor Breakdown
                        </h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Hourly Rate</th>
                                        <th className="px-6 py-4">Billable Hours</th>
                                        <th className="px-6 py-4 text-right">Cost Incurred</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {details.employees.map((emp: any) => (
                                        <tr key={emp.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{emp.name}</div>
                                                <div className="text-[10px] text-gray-400 lowercase">{emp.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-bold">{formatCurrency(emp.hourlyRate)}/hr</td>
                                            <td className="px-6 py-4 font-black">{emp.totalBillableHours.toFixed(1)} hrs</td>
                                            <td className="px-6 py-4 text-right font-black text-red-600">{formatCurrency(emp.cost)}</td>
                                        </tr>
                                    ))}
                                    {details.employees.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic font-medium">
                                                No billable labor recorded for this project yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Profitability Analysis */}
                    <div className="bg-black text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-700 group-hover:bg-blue-500/20"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                                    <BarChart3 size={14} className="text-blue-500" />
                                    Profitability Analysis
                                </h4>
                                <div className="space-y-1">
                                    <div className="text-4xl font-black tracking-tight flex items-baseline gap-3">
                                        {profitMargin.toFixed(1)}%
                                        <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Profit Margin</span>
                                    </div>
                                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                                        Calculated based on contract value vs. total labor and overhead allocation. 
                                        {profitMargin > 20 ? " Exceptional project performance." : " Monitor labor efficiency carefully."}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Net Gain</div>
                                <div className={`text-4xl font-black ${details.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                                    {formatCurrency(details.profit)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
                        <Info size={16} className="text-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-wider leading-none">
                            Overhead is allocated based on an even split across all {details.activeProjectCount || "active"} projects.
                        </p>
                    </div>

                </div>

                <div className="px-8 py-4 bg-white border-t border-gray-100 flex justify-end">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="bg-black text-white px-10 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                        Close Summary
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
