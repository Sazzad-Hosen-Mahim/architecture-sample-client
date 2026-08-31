import { useState } from "react";
import {
  useGetConsultationRefundsQuery,
  useProcessConsultationRefundMutation,
  ConsultationRefund,
} from "@/redux/api/consultationRefundApi";
import {
  CheckCircle,
  Clock,
  DollarSign,
  User,
  ArrowLeft,
  Search,
  Landmark,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import CommonWrapper from "@/common/CommonWrapper";
import { Loader } from "@/components/ui/loader";

export default function ConsultationRefunds() {
  const { data, isLoading, refetch } = useGetConsultationRefundsQuery();
  const [processRefund, { isLoading: isProcessing }] =
    useProcessConsultationRefundMutation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refunds = data?.data || [];
  const pendingCount = data?.pending ?? 0;

  const filtered = refunds.filter((r: ConsultationRefund) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.clientName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.projectName?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleProcess = async (id: string) => {
    try {
      const res = await processRefund(id).unwrap();
      toast.success(res?.message || "Refund processed");
      setConfirmId(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process refund");
    }
  };

  const statusBadge = (status: string) => {
    if (status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest">
          <Clock size={12} /> Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-widest">
        <CheckCircle size={12} /> Processed
      </span>
    );
  };

  if (isLoading) return <Loader />;

  return (
    <CommonWrapper>
      <div className="mt-8 space-y-6">
        <div className="space-y-3">
          <Link
            to="/dashboard/financials?tab=payroll"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} /> Back to Accountant Controls
          </Link>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Consultation Refunds
            </h1>
            <span className="text-sm font-bold text-gray-400">
              {pendingCount} Pending
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Consultation fees to be returned to clients whose account-less
            inquiry was declined. Processing refunds the card through Stripe and
            marks the record done in one step.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, email or project..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "PENDING", "PROCESSED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  filterStatus === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s === "ALL" ? `All (${refunds.length})` : s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">No consultation refunds found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {[
                      "Client",
                      "Project",
                      "Amount",
                      "Payment Ref",
                      "Status",
                      "Declined",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: ConsultationRefund) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={14} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {r.clientName || "—"}
                            </p>
                            <p className="text-xs text-gray-400">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {r.projectName || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        ${Number(r.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-[10px] font-mono text-gray-400"
                          title={r.consultationPaymentId}
                        >
                          {r.consultationPaymentId?.slice(0, 18)}…
                        </span>
                        {r.stripeRefundId && (
                          <p className="text-[10px] font-mono text-green-600 mt-0.5">
                            {r.stripeRefundId}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">{statusBadge(r.status)}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                        {r.processedAt && (
                          <p className="text-[10px] text-green-600 mt-0.5">
                            Paid {new Date(r.processedAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.status === "PENDING" ? (
                          <button
                            onClick={() => setConfirmId(r.id)}
                            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 inline-flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <Landmark size={12} /> Process Refund
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-700">
                            <CheckCircle size={12} /> Refunded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {confirmId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                Process consultation refund
              </h3>
              {(() => {
                const r = refunds.find((x) => x.id === confirmId);
                if (!r) return null;
                return (
                  <p className="text-sm text-gray-600">
                    This refunds{" "}
                    <span className="font-semibold">
                      ${Number(r.amount).toLocaleString()}
                    </span>{" "}
                    to <span className="font-semibold">{r.email}</span>'s card
                    through Stripe and marks this record processed. This cannot
                    be undone.
                  </p>
                );
              })()}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcess(confirmId)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-gray-700 disabled:opacity-60"
                >
                  {isProcessing ? "Processing..." : "Confirm & Refund"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CommonWrapper>
  );
}
