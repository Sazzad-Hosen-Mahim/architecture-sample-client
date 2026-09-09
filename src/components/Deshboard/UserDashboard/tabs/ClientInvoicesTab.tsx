import { useState } from "react";
import { Loader2, ReceiptText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/money";
import {
  useGetProjectInvoicesQuery,
  usePayInvoiceMutation,
  type Invoice,
} from "@/redux/api/invoiceApi";

const TYPE_LABEL: Record<Invoice["type"], string> = {
  REIMBURSABLE_EXPENSE: "Reimbursable Expense",
  ADDITIONAL_SERVICE: "Additional Service",
};

const TYPE_HELP: Record<Invoice["type"], string> = {
  REIMBURSABLE_EXPENSE:
    "Paid on your behalf to keep the project moving, and billed back to you.",
  ADDITIONAL_SERVICE: "Work carried out beyond the original scope.",
};

interface ClientInvoicesTabProps {
  projectId: string;
}

/**
 * Invoice Payment — bills raised against this project outside the contract.
 *
 * Kept visually distinct from the contract and amendment cards above on
 * purpose: an invoice adds to what is owed but is not a contract payment, and
 * a client reading their own paperwork should be able to tell the two apart at
 * a glance rather than by reading the amounts.
 */
export default function ClientInvoicesTab({
  projectId,
}: ClientInvoicesTabProps) {
  const { data: invoices = [], isLoading } =
    useGetProjectInvoicesQuery(projectId);
  const [payInvoice] = usePayInvoiceMutation();
  const [payingId, setPayingId] = useState<string | null>(null);

  // Cancelled invoices are withdrawn — the client owes nothing on them and
  // showing them would only raise questions about a bill that no longer exists.
  const visible = invoices.filter((invoice) => invoice.status !== "CANCELLED");

  const handlePay = async (invoice: Invoice) => {
    setPayingId(invoice.id);
    try {
      const { checkoutUrl } = await payInvoice({
        projectId,
        invoiceId: invoice.id,
      }).unwrap();
      // Full navigation rather than a new tab: Stripe returns the client here
      // through its own success URL, and a popup would strand that return.
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not open the payment page");
      setPayingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading invoices…
      </div>
    );
  }

  if (visible.length === 0) return null;

  const outstanding = visible.filter((i) => i.status === "SENT").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Invoice Payment
        </h4>
        <div className="flex-1 h-px bg-gray-100" />
        {outstanding > 0 && (
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 flex-shrink-0">
            {outstanding} due
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((invoice) => {
          const isPaid = invoice.status === "PAID";
          return (
            <div
              key={invoice.id}
              className="flex items-start gap-3 p-4 rounded-xl border border-sky-200 bg-sky-50/60"
            >
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                <ReceiptText className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-800">
                    {invoice.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                    {TYPE_LABEL[invoice.type]}
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 mt-0.5">
                  {TYPE_HELP[invoice.type]}
                </p>

                {invoice.description && (
                  <p className="text-xs text-gray-600 mt-1 break-words">
                    {invoice.description}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Amount Due
                </div>
                <div className="text-lg font-black text-gray-800 leading-none">
                  {formatCurrency(Number(invoice.amount))}
                </div>

                {isPaid ? (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" />
                    Paid
                  </div>
                ) : (
                  <button
                    onClick={() => handlePay(invoice)}
                    disabled={payingId === invoice.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {payingId === invoice.id && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Pay Invoice
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
