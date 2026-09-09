import { useState } from "react";
import { Loader2, ReceiptText, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { formatCurrency } from "@/utils/money";
import {
  useCancelInvoiceMutation,
  useGetProjectInvoicesQuery,
  type Invoice,
} from "@/redux/api/invoiceApi";

const TYPE_LABEL: Record<Invoice["type"], string> = {
  REIMBURSABLE_EXPENSE: "Reimbursable Expense",
  ADDITIONAL_SERVICE: "Additional Service",
};

const STATUS_STYLE: Record<Invoice["status"], string> = {
  SENT: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface InvoiceListProps {
  projectId: string;
  canEdit: boolean;
}

export default function InvoiceList({ projectId, canEdit }: InvoiceListProps) {
  const { data: invoices = [], isLoading } =
    useGetProjectInvoicesQuery(projectId);
  const [cancelInvoice, { isLoading: isCancelling }] =
    useCancelInvoiceMutation();
  const user = useAppSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  const handleCancel = async (invoice: Invoice) => {
    try {
      await cancelInvoice({ projectId, invoiceId: invoice.id }).unwrap();
      toast.success("Invoice cancelled");
      setCancelTarget(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not cancel the invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading invoices…
      </div>
    );
  }

  if (invoices.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Invoices
      </h4>

      {invoices.map((invoice) => {
        // A paid invoice is locked to everyone but a Super Admin: cancelling
        // it reverses money already received.
        const canCancel =
          canEdit &&
          invoice.status !== "CANCELLED" &&
          (invoice.status !== "PAID" || isSuperAdmin);

        return (
          <div
            key={invoice.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              invoice.status === "CANCELLED"
                ? "border-gray-200 bg-gray-50 opacity-60"
                : "border-sky-200 bg-sky-50/50"
            }`}
          >
            <ReceiptText className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800">
                  {invoice.name}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded ${STATUS_STYLE[invoice.status]}`}
                >
                  {invoice.status}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  {TYPE_LABEL[invoice.type]}
                </span>
              </div>

              {invoice.description && (
                <p className="text-xs text-gray-500 mt-0.5 break-words">
                  {invoice.description}
                </p>
              )}

              {invoice.proposal && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Applies to {invoice.proposal.proposalNumber}
                </p>
              )}

              {invoice.status === "CANCELLED" && invoice.cancelReason && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Cancelled: {invoice.cancelReason}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(Number(invoice.amount))}
              </div>
              {invoice.status === "PAID" && (
                <div className="flex items-center justify-end gap-1 text-[10px] text-green-700 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Paid
                </div>
              )}
              {canCancel &&
                (cancelTarget?.id === invoice.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => handleCancel(invoice)}
                      disabled={isCancelling}
                      className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                    >
                      {isCancelling ? "…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setCancelTarget(null)}
                      className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCancelTarget(invoice)}
                    title={
                      invoice.status === "PAID"
                        ? "Cancelling a paid invoice reverses money already received"
                        : "Cancel this invoice"
                    }
                    className="inline-flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700 mt-1 cursor-pointer"
                  >
                    <Ban className="w-3 h-3" />
                    Cancel
                  </button>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
