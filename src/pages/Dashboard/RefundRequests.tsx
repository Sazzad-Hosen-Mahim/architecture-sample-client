import { useState } from "react";
import {
    useGetRefundRequestsQuery,
    useApproveRefundMutation,
    useRejectRefundMutation,
} from "@/redux/api/refundApi";
import { CheckCircle, XCircle, Clock, DollarSign, User, ArrowLeft, AlertCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import CommonWrapper from "@/common/CommonWrapper";
import { Loader } from "@/components/ui/loader";

export default function RefundRequests() {
    const { data: refundsData, isLoading, refetch } = useGetRefundRequestsQuery(undefined);
    const [approveRefund, { isLoading: isApproving }] = useApproveRefundMutation();
    const [rejectRefund, { isLoading: isRejecting }] = useRejectRefundMutation();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: "", open: false });
    const [rejectionReason, setRejectionReason] = useState("");

    const refunds = refundsData?.data || [];
    const filteredRefunds = refunds.filter((r: any) => {
        const matchesSearch = r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            r.projectRequest?.projectName?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === "ALL" || r.refundStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleApprove = async (id: string) => {
        try { await approveRefund(id).unwrap(); toast.success("Refund approved"); refetch(); }
        catch (err: any) { toast.error(err?.data?.message || "Failed"); }
    };

    const handleReject = async () => {
        try { await rejectRefund({ id: rejectModal.id, rejectionReason }).unwrap(); toast.success("Refund rejected"); setRejectModal({ id: "", open: false }); setRejectionReason(""); refetch(); }
        catch (err: any) { toast.error(err?.data?.message || "Failed"); }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; icon: any; label: string }> = {
            PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock, label: "Pending" },
            APPROVED: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: CheckCircle, label: "Approved" },
            REJECTED: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircle, label: "Rejected" },
        };
        const s = map[status]; if (!s) return null;
        const Icon = s.icon;
        return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${s.bg} ${s.text} text-[10px] font-black uppercase tracking-widest border`}><Icon size={12} />{s.label}</span>;
    };

    const pendingCount = refunds.filter((r: any) => r.refundStatus === "PENDING").length;
    if (isLoading) return <Loader />;

    return (
        <CommonWrapper>
            <div className="mt-8 space-y-6">
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><DollarSign size={180} /></div>
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <Link to="/dashboard/financials" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs font-bold transition-colors mb-2"><ArrowLeft size={14} /> Back to Financials</Link>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest"><AlertCircle size={12} /> Refund Management</div>
                        <h1 className="text-4xl font-black tracking-tight">Refund Requests <br /><span className="text-gray-400">{pendingCount} Pending</span></h1>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-2">
                        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{s === "ALL" ? `All (${refunds.length})` : s}</button>
                        ))}
                    </div>
                </div>

                {filteredRefunds.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 font-bold">No refund requests found</p></div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                                    {["Client", "Project", "Phase", "Cause", "Amount", "Status", "Date", "Actions"].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {filteredRefunds.map((r: any) => (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><User size={14} className="text-gray-500" /></div><div><p className="text-sm font-bold text-gray-900">{r.user?.name || "—"}</p><p className="text-xs text-gray-400">{r.user?.email}</p></div></div></td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{r.projectRequest?.projectName || "—"}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{r.stageName}</td>
                                            <td className="px-6 py-4"><p className="text-xs text-gray-600 max-w-[150px] truncate" title={r.refundCause}>{r.refundCause}</p></td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">${Number(r.amount).toLocaleString()}</td>
                                            <td className="px-6 py-4">{statusBadge(r.refundStatus)}</td>
                                            <td className="px-6 py-4 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                {r.refundStatus === "PENDING" && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleApprove(r.id)} disabled={isApproving} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold uppercase hover:bg-green-100">Accept</button>
                                                        <button onClick={() => setRejectModal({ id: r.id, open: true })} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100">Reject</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {rejectModal.open && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Reject Refund</h3>
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Rejection reason (optional)..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                            <div className="flex gap-3">
                                <button onClick={() => { setRejectModal({ id: "", open: false }); setRejectionReason(""); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase hover:bg-gray-50">Cancel</button>
                                <button onClick={handleReject} disabled={isRejecting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700">{isRejecting ? "..." : "Confirm Reject"}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CommonWrapper>

    );
}
