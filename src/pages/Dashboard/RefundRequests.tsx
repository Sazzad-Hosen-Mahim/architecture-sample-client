import { useState } from "react";
import {
    useGetRefundRequestsQuery,
    useApproveRefundMutation,
    useRejectRefundMutation,
} from "@/redux/api/refundApi";
import { CheckCircle, XCircle, Clock, DollarSign, User, ArrowLeft, Search, Landmark, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import CommonWrapper from "@/common/CommonWrapper";
import RefundPayoutModal from "@/components/Modal/RefundPayoutModal";
import { Loader } from "@/components/ui/loader";

export default function RefundRequests() {
    const { data: refundsData, isLoading, refetch } = useGetRefundRequestsQuery(undefined);
    const [approveRefund, { isLoading: isApproving }] = useApproveRefundMutation();
    const [rejectRefund, { isLoading: isRejecting }] = useRejectRefundMutation();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: "", open: false });
    const [rejectionReason, setRejectionReason] = useState("");
    const [reasoningModal, setReasoningModal] = useState<any>(null);
    const [payoutRefundId, setPayoutRefundId] = useState<string | null>(null);

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
                <div className="space-y-3">
                    <Link
                        to="/dashboard/financials"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-xs font-bold transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Accountant Controls
                    </Link>
                    <div className="flex flex-wrap items-baseline gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">Refund Requests</h1>
                        <span className="text-sm font-bold text-gray-400">{pendingCount} Pending</span>
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
                                    {["Client", "Project", "Phase", "Reasoning", "Amount", "Status", "Date", "Actions"].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {filteredRefunds.map((r: any) => (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><User size={14} className="text-gray-500" /></div><div><p className="text-sm font-bold text-gray-900">{r.user?.name || "—"}</p><p className="text-xs text-gray-400">{r.user?.email}</p></div></div></td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{r.projectRequest?.projectName || "—"}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{r.stageName}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setReasoningModal(r)}
                                                    className="text-xs font-bold text-blue-600 underline decoration-dotted underline-offset-4 hover:text-blue-800 max-w-[150px] truncate text-left"
                                                    title="View the client's reasoning"
                                                >
                                                    {r.refundCause || "View reasoning"}
                                                </button>
                                            </td>
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
                                                {/* Approved refunds still need paying out */}
                                                {r.refundStatus === "APPROVED" && (
                                                    r.refundProcessedAt ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-700">
                                                            <CheckCircle size={12} /> Refund Processed
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setPayoutRefundId(r.id)}
                                                            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 inline-flex items-center gap-1.5 transition-all active:scale-95"
                                                        >
                                                            <Landmark size={12} /> Process Refund
                                                        </button>
                                                    )
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

                {/* The client's stated reasoning, in full */}
                {reasoningModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Refund Reasoning</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {reasoningModal.user?.name} · {reasoningModal.projectRequest?.projectName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReasoningModal(null)}
                                    className="text-gray-400 hover:text-black p-1 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cause</p>
                                    <p className="text-sm font-bold text-gray-800">{reasoningModal.refundCause || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Details</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {reasoningModal.refundDescription || "No further detail provided."}
                                    </p>
                                </div>
                                <div className="flex gap-6 pt-2 border-t border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phase</p>
                                        <p className="text-sm font-bold text-gray-800">{reasoningModal.stageName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                                        <p className="text-sm font-black text-gray-900">
                                            ${Number(reasoningModal.amount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setReasoningModal(null)}
                                    className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {payoutRefundId && (
                    <RefundPayoutModal
                        refundId={payoutRefundId}
                        onClose={() => setPayoutRefundId(null)}
                    />
                )}
            </div>
        </CommonWrapper>

    );
}
