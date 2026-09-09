import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateInvoiceMutation,
  type InvoiceType,
} from "@/redux/api/invoiceApi";

interface AcceptedContract {
  id: string;
  proposalNumber: string;
  proposalType: "NORMAL" | "AMENDMENT";
}

interface NewInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** Accepted contracts this invoice can be raised against. */
  contracts: AcceptedContract[];
}

const INVOICE_TYPES: { value: InvoiceType; label: string; help: string }[] = [
  {
    value: "REIMBURSABLE_EXPENSE",
    label: "Reimbursable Expense",
    help: "Something the firm paid on the client's behalf — permit fees and the like. It shows as a cost until they repay it, then clears to zero.",
  },
  {
    value: "ADDITIONAL_SERVICE",
    label: "Additional Service",
    help: "Work beyond the contracted scope. Nothing is deducted; the amount becomes revenue once the client pays.",
  },
];

/** Digits and one decimal point, so the field can't hold "12..3" or letters. */
const sanitizeAmount = (raw: string) => {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

const withCommas = (value: string) => {
  if (!value) return "";
  const [whole, decimals] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals !== undefined ? `${grouped}.${decimals}` : grouped;
};

export default function NewInvoiceModal({
  open,
  onClose,
  projectId,
  contracts,
}: NewInvoiceModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<InvoiceType | "">("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [proposalId, setProposalId] = useState("");

  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();

  const selectedType = useMemo(
    () => INVOICE_TYPES.find((t) => t.value === type),
    [type],
  );

  const numericAmount = Number(amount || 0);
  const canSubmit =
    name.trim().length > 0 && !!type && numericAmount > 0 && !isLoading;

  const reset = () => {
    setName("");
    setType("");
    setAmount("");
    setDescription("");
    setProposalId("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !type) return;

    try {
      await createInvoice({
        projectId,
        name: name.trim(),
        type,
        amount: numericAmount,
        description: description.trim() || undefined,
        proposalId: proposalId || undefined,
      }).unwrap();
      toast.success("Invoice sent to client");
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not send the invoice");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="w-4 h-4 text-sky-700" />
            New Invoice
          </DialogTitle>
          <p className="text-xs text-gray-500">
            A bill to the client outside the contract. They can pay it from
            their own portal.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Invoice Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City permit fee"
              maxLength={200}
              className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Invoice Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InvoiceType)}
              className="w-full border border-gray-300 rounded-md p-2.5 text-sm bg-white focus:ring-1 focus:ring-black focus:border-black outline-none"
            >
              <option value="">Select a type…</option>
              {INVOICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {/* The two behave differently in the accounts, and the difference
                is not guessable from the name alone. */}
            {selectedType && (
              <p className="text-[11px] text-gray-500 mt-1">
                {selectedType.help}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Invoice Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
              </span>
              <input
                inputMode="decimal"
                value={withCommas(amount)}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-md p-2.5 pl-7 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
              />
            </div>
          </div>

          {/* Which contract this extends. Optional — the Financial Summary
              rolls every invoice together regardless, but the client's portal
              shows it beside the contract it belongs to. */}
          {contracts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Applies To
              </label>
              <select
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2.5 text-sm bg-white focus:ring-1 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Not linked to a contract</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.proposalType === "AMENDMENT"
                      ? "Amendment"
                      : "Original Contract"}{" "}
                    — {contract.proposalNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Invoice Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What this covers, so the client knows what they are paying for."
              className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send to Client
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
