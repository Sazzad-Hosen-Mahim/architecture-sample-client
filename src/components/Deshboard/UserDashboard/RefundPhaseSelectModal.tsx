import { useEffect, useMemo, useState } from "react";
import { X, RefreshCcw, CheckSquare, Square } from "lucide-react";

export interface RefundablePhase {
  id: string;
  name: string;
  amount: number;
}

interface RefundPhaseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Contract the refund is being requested against. */
  contractTitle: string;
  contractNumber?: string | null;
  /** Only phases the client has actually paid for. */
  phases: RefundablePhase[];
  onConfirm: (selected: RefundablePhase[]) => void;
}

const money = (value: number) => `$${Number(value || 0).toLocaleString()}`;

/**
 * Step one of the contract-level refund flow: which phases of this contract is
 * the refund for? Only paid phases can be refunded, and each selected phase
 * becomes its own refund request so the firm can rule on them individually.
 */
export default function RefundPhaseSelectModal({
  isOpen,
  onClose,
  contractTitle,
  contractNumber,
  phases,
  onConfirm,
}: RefundPhaseSelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Start fresh each time the modal opens.
  useEffect(() => {
    if (isOpen) setSelectedIds(new Set());
  }, [isOpen]);

  const allSelected = phases.length > 0 && selectedIds.size === phases.length;
  const selectedPhases = useMemo(
    () => phases.filter((p) => selectedIds.has(p.id)),
    [phases, selectedIds]
  );
  const selectedTotal = selectedPhases.reduce((sum, p) => sum + p.amount, 0);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(phases.map((p) => p.id)));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex justify-between items-start gap-4 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-red-500" />
              Request Refund
            </h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
              {contractTitle}
              {contractNumber ? ` · ${contractNumber}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-5 space-y-3">
          {phases.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-gray-500">Nothing to refund yet</p>
              <p className="text-xs text-gray-400 mt-1 italic max-w-xs mx-auto">
                A refund can only be requested for phases you have already paid for on this
                contract.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-medium">
                Select the phases you'd like refunded. Each becomes its own request, so they can be
                reviewed separately.
              </p>

              <button
                onClick={toggleAll}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                {allSelected ? (
                  <CheckSquare size={16} className="text-red-600 flex-shrink-0" />
                ) : (
                  <Square size={16} className="text-gray-300 flex-shrink-0" />
                )}
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Select all — entire contract
                </span>
              </button>

              <div className="space-y-2">
                {phases.map((phase) => {
                  const isSelected = selectedIds.has(phase.id);
                  return (
                    <button
                      key={phase.id}
                      onClick={() => toggle(phase.id)}
                      className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-red-300 bg-red-50/60"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-red-600 flex-shrink-0" />
                        ) : (
                          <Square size={16} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span className="text-sm font-bold text-gray-900 truncate">{phase.name}</span>
                      </div>
                      <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                        {money(phase.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {phases.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {selectedPhases.length} phase{selectedPhases.length === 1 ? "" : "s"} selected
              </span>
              <span className="text-lg font-black text-gray-900">{money(selectedTotal)}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(selectedPhases)}
                disabled={selectedPhases.length === 0}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
