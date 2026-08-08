import {
  useGetRefundBankDetailsQuery,
  useMarkRefundProcessedMutation,
} from "@/redux/api/refundApi";
import { Building2, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface RefundPayoutModalProps {
  refundId: string;
  onClose: () => void;
}

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-white break-all">{value || "—"}</p>
  </div>
);

/**
 * Bank details for actioning an approved refund, plus the "Task Completed"
 * confirmation that stops the daily reminder notifications.
 */
export default function RefundPayoutModal({ refundId, onClose }: RefundPayoutModalProps) {
  const { data, isLoading } = useGetRefundBankDetailsQuery(refundId);
  const [markProcessed, { isLoading: isSaving }] = useMarkRefundProcessedMutation();

  const payload = data?.data;
  const bank = payload?.bankDetails;
  const isProcessed = !!payload?.refundProcessedAt;

  const handleComplete = async () => {
    try {
      await markProcessed(refundId).unwrap();
      toast.success("Refund marked as processed — reminders stopped");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to mark as processed");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Process Refund</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Client banking information
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Refund Amount
                  </p>
                  <p className="text-lg font-black text-red-600">{money(payload?.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Client
                  </p>
                  <p className="text-sm font-black text-gray-900 truncate">
                    {payload?.client?.name || "—"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold truncate">
                    {payload?.client?.email}
                  </p>
                </div>
              </div>

              <div className="text-xs font-bold text-gray-500">
                {payload?.projectName} · {payload?.stageName}
              </div>

              {bank ? (
                <div className="p-5 bg-gray-900 rounded-2xl text-white space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <Field label="Bank Name" value={bank.bankName} />
                    <Building2 size={18} className="text-gray-600" />
                  </div>
                  <Field label="Account Holder" value={bank.accountHolderName} />
                  <Field label="Account Number" value={bank.accountNumber} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Routing Number" value={bank.routingNumber} />
                    <Field label="Type" value={bank.bankType || "REGULAR"} />
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-bold text-amber-800">
                    This client has no bank details on file. Contact them for payout instructions
                    before marking the refund processed.
                  </p>
                </div>
              )}

              {isProcessed ? (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-green-700 uppercase tracking-widest">
                      Refund Processed
                    </p>
                    <p className="text-[10px] font-bold text-green-600">
                      {new Date(payload.refundProcessedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] font-bold text-gray-400 italic">
                  You'll keep getting a daily reminder until this is marked complete.
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {!isProcessed && !isLoading && (
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2 transition-all active:scale-95"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Task Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
