import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
import { Check, FileText, Loader2, Trash2 } from "lucide-react";
// import { useParams } from "react-router-dom";
import {
  useAddServiceMutation,
  useDeleteProposalServiceMutation,
  useGetProposalFullQuery,
  useReorderProposalServicesMutation,
  useUpdateProposalPaymentPlanMutation,
  type ProposalService,
} from "@/redux/api/adminDashboard/proposalApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Cookies from "js-cookie";
import { toast } from "sonner";

interface Credit {
  id: string;
  type: "dollar" | "percentage";
  amount: number;
  description: string;
}

interface Objective {
  id: string;
  label: string;
  custom?: boolean;
}

interface ServicesFormProps {
  objectives: Objective[];
  selectedObjectives: string[];
  toggleObjective: (id: string) => void;
  objectiveCosts: Record<string, number>;
  objectiveTimelines: Record<string, number>;
  handleCostChange: (id: string, value: string) => void; // changed to string
  handleTimelineChange: (id: string, value: string) => void; // changed to string
  // Supplied by the project-linked proposal flow. The standalone blank-proposal
  // page omits these, which hides the ordering/custom-phase controls.
  objectiveOrders?: Record<string, number>;
  handleOrderChange?: (id: string, value: string) => void;
  addCustomPhase?: () => void;
  updatePhaseLabel?: (id: string, label: string) => void;
  removeCustomPhase?: (id: string) => void;
  credits: Credit[];
  setCredits: React.Dispatch<React.SetStateAction<Credit[]>>;
  calculateTotalCredits: () => number;
  totalCost: number;
  totalWeeks: number;
  finalCost: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  handleNext: () => void;
  handleBack: () => void;
}

export default function ServicesTabForm({
  objectives,
  selectedObjectives,
  toggleObjective,
  objectiveCosts,
  objectiveTimelines,
  handleCostChange,
  handleTimelineChange,
  objectiveOrders,
  handleOrderChange,
  addCustomPhase,
  updatePhaseLabel,
  removeCustomPhase,
  credits,
  // setCredits,
  calculateTotalCredits,
  totalCost,
  totalWeeks,
  finalCost,
  paymentMethod,
  setPaymentMethod,
  handleNext,
  handleBack,
}: ServicesFormProps) {
  // const [showAddCredit, setShowAddCredit] = useState(false);
  // const [newCredit, setNewCredit] = useState<Credit>({
  //   id: "",
  //   type: "dollar",
  //   amount: 0,
  //   description: "",
  // });

  // const { id } = useParams();

  const proposalCookie = Cookies.get("proposal_data") || "";
  let parsedProposalData: any = null;
  try {
    parsedProposalData = proposalCookie ? JSON.parse(proposalCookie) : null;
  } catch {
    parsedProposalData = null;
  }
  const id = parsedProposalData?.data?.id;

  const [addService] = useAddServiceMutation();
  const [deleteProposalService] = useDeleteProposalServiceMutation();
  const [reorderServices] = useReorderProposalServicesMutation();
  const [updatePaymentPlan] = useUpdateProposalPaymentPlanMutation();

  // The saved services are the source of truth for what has actually been added
  // — deriving the button state from them (rather than from local state) keeps
  // "Added" correct after a reload or when resuming a draft.
  const { data: proposalData } = useGetProposalFullQuery(id || "", {
    skip: !id,
  });
  const fetchedServices: ProposalService[] = proposalData?.data?.services || [];

  const normalize = (value: string) => value.trim().toLowerCase();

  // The refetch triggered by adding a service lands a moment after the mutation
  // resolves; holding the row the mutation returned keeps the button on "Added"
  // instead of flickering back to "Add" during that gap.
  const [justSaved, setJustSaved] = useState<Record<string, ProposalService>>(
    {},
  );

  const savedServices: ProposalService[] = [
    ...fetchedServices,
    ...Object.values(justSaved).filter(
      (local) => !fetchedServices.some((s) => s.id === local.id),
    ),
  ];

  const savedServiceFor = (label: string) => {
    const key = normalize(label || "");
    if (!key) return undefined;
    return savedServices.find((s) => normalize(s.name) === key);
  };

  // A saved service whose cost/weeks/order no longer match the form has
  // unsaved edits, so the button offers "Update" instead of showing "Added".
  const hasUnsavedEdits = (objectiveId: string, saved: ProposalService) =>
    Number(saved.amount) !== (Number(objectiveCosts[objectiveId]) || 0) ||
    Number(saved.timelineWeeks || 0) !==
      (Number(objectiveTimelines[objectiveId]) || 0) ||
    (objectiveOrders?.[objectiveId] !== undefined &&
      Number(saved.order) !== Number(objectiveOrders[objectiveId]));

  const [pendingObjectiveId, setPendingObjectiveId] = useState<string | null>(
    null,
  );
  const [isContinuing, setIsContinuing] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [removalSelection, setRemovalSelection] = useState<
    Record<string, boolean>
  >({});
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAddService = async (objective: Objective) => {
    if (!id) {
      toast.error(
        "Proposal not found. Please start again from the Project step.",
      );
      return;
    }

    const name = objective.label.trim();
    if (!name) {
      toast.error("Please give this phase a name before adding it");
      return;
    }

    const cost = Number(objectiveCosts[objective.id]) || 0;
    const timelineWeeks = Number(objectiveTimelines[objective.id]) || 0;

    if (cost === 0 || timelineWeeks === 0) {
      toast.error(
        "Please enter both cost and timeline before adding the service",
      );
      return;
    }

    setPendingObjectiveId(objective.id);
    try {
      const result = await addService({
        id,
        name,
        cost,
        timelineWeeks,
        order: Number(objectiveOrders?.[objective.id]) || undefined,
      }).unwrap();

      if (result?.data) {
        setJustSaved((prev) => ({ ...prev, [result.data.id]: result.data }));
      }

      // Adding a service is what puts it in the proposal, so the checkbox and
      // the summary totals follow the save rather than the other way round.
      if (!selectedObjectives.includes(objective.id)) {
        toggleObjective(objective.id);
      }
      toast.success(result?.message || `Service "${name}" added successfully!`);
    } catch (error: any) {
      console.error("Failed to add service:", error);
      toast.error(
        error?.data?.message || "Failed to add service. Please try again.",
      );
    } finally {
      setPendingObjectiveId(null);
    }
  };

  const removeSavedService = async (
    service: ProposalService,
    objectiveId?: string,
  ) => {
    if (!id) return false;
    try {
      await deleteProposalService({
        proposalId: id,
        serviceId: service.id,
      }).unwrap();
      setJustSaved((prev) => {
        const next = { ...prev };
        delete next[service.id];
        return next;
      });
      if (objectiveId && selectedObjectives.includes(objectiveId)) {
        toggleObjective(objectiveId);
      }
      return true;
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Could not remove "${service.name}". Please try again.`,
      );
      return false;
    }
  };

  // Unticking a phase that has already been saved takes it off the proposal —
  // otherwise the checkbox and the saved services would silently disagree.
  const handleToggleObjective = async (objective: Objective) => {
    const saved = savedServiceFor(objective.label);
    if (saved && selectedObjectives.includes(objective.id)) {
      setPendingObjectiveId(objective.id);
      const removed = await removeSavedService(saved, objective.id);
      setPendingObjectiveId(null);
      if (removed) toast.success(`Service "${saved.name}" removed.`);
      return;
    }
    toggleObjective(objective.id);
  };

  const openServicesModal = () => {
    // Every saved service starts checked; unchecking marks it for removal.
    setRemovalSelection(
      Object.fromEntries(savedServices.map((s) => [s.id, true])),
    );
    setShowServicesModal(true);
  };

  const objectiveIdForService = (service: ProposalService) =>
    objectives.find((o) => normalize(o.label) === normalize(service.name))?.id;

  const handleRemoveDeselected = async () => {
    if (!id) return;
    const toRemove = savedServices.filter(
      (s) => removalSelection[s.id] === false,
    );
    if (toRemove.length === 0) return;

    setIsRemoving(true);
    let removed = 0;
    for (const service of toRemove) {
      const ok = await removeSavedService(
        service,
        objectiveIdForService(service),
      );
      if (ok) removed += 1;
    }
    setIsRemoving(false);

    if (removed > 0) {
      toast.success(`${removed} service${removed > 1 ? "s" : ""} removed.`);
      setShowServicesModal(false);
    }
  };

  const persistOrderThenContinue = async () => {
    if (savedServices.length === 0) {
      toast.error("Please add at least one service before continuing.");
      return;
    }

    setIsContinuing(true);
    try {
      const items = savedServices
        .map((service) => {
          const objectiveId = objectiveIdForService(service);
          return {
            id: service.id,
            order: objectiveId
              ? Number(objectiveOrders?.[objectiveId]) || 0
              : 0,
          };
        })
        .filter((i) => i.order > 0);

      if (id && items.length > 0) {
        try {
          await reorderServices({ id, items }).unwrap();
        } catch {
          toast.error("Could not save the service order. Please try again.");
          return;
        }
      }

      // The payment plan is chosen here but the proposal was created back on the
      // Project step, so it has to be pushed explicitly. Without this the row
      // keeps the backend's LUMP_SUM default no matter what the PM picked.
      if (id) {
        try {
          await updatePaymentPlan({ id, paymentMethod }).unwrap();
        } catch {
          toast.error("Could not save the payment type. Please try again.");
          return;
        }
      }

      handleNext();
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold border-l-4 border-blue-600 pl-3">
              Scope of Services
            </h2>
            {addCustomPhase && (
              <button
                type="button"
                onClick={addCustomPhase}
                className="text-white bg-teal-700 cursor-pointer hover:bg-teal-800 px-3 py-1 rounded"
              >
                + Add Phase
              </button>
            )}
            {/* <span className="ml-4 text-sm text-gray-500">
              Selected: {selectedObjectives.length} / 8
            </span> */}
          </div>
          {objectives.map((objective) => (
            <div
              key={objective.id}
              className="mb-4 border border-gray-300 rounded-md overflow-hidden"
            >
              <div className="flex items-center p-3 bg-gray-50">
                {handleOrderChange && (
                  <div className="flex flex-col items-center mr-3">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                      Order
                    </span>
                    <Input
                      type="number"
                      min="1"
                      aria-label={`Display order for ${objective.label || "new phase"}`}
                      value={objectiveOrders?.[objective.id]?.toString() || ""}
                      onChange={(e) =>
                        handleOrderChange(objective.id, e.target.value)
                      }
                      className="w-14 h-8 text-sm text-center"
                    />
                  </div>
                )}
                <Checkbox
                  id={objective.id}
                  checked={selectedObjectives.includes(objective.id)}
                  onCheckedChange={() => handleToggleObjective(objective)}
                  disabled={pendingObjectiveId === objective.id}
                  className="mr-3"
                />
                {objective.custom && updatePhaseLabel ? (
                  <div className="flex items-center gap-2 flex-grow mr-2">
                    <Input
                      value={objective.label}
                      onChange={(e) =>
                        updatePhaseLabel(objective.id, e.target.value)
                      }
                      placeholder="Phase name"
                      className="h-8 text-sm font-medium"
                    />
                    {removeCustomPhase && (
                      <button
                        type="button"
                        onClick={() => removeCustomPhase(objective.id)}
                        aria-label="Remove phase"
                        className="text-red-500 hover:text-red-700 px-1 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor={objective.id}
                    className="font-medium cursor-pointer flex-grow"
                  >
                    {objective.label}
                  </label>
                )}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-1">$</span>
                    <Input
                      type="number"
                      min="0"
                      value={objectiveCosts[objective.id]?.toString() || "0"}
                      onChange={
                        (e) => handleCostChange(objective.id, e.target.value) // string
                      }
                      className="w-24 h-8 text-sm"
                      placeholder="Cost"
                    />
                  </div>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      value={
                        objectiveTimelines[objective.id]?.toString() || "0"
                      }
                      onChange={
                        (e) =>
                          handleTimelineChange(objective.id, e.target.value) // string
                      }
                      className="w-16 h-8 text-sm"
                      placeholder="Weeks"
                    />
                    <span className="text-sm text-gray-500 ml-1">wks</span>
                  </div>
                  <div>
                    {(() => {
                      const saved = savedServiceFor(objective.label);
                      const isAdding = pendingObjectiveId === objective.id;
                      const needsUpdate = saved
                        ? hasUnsavedEdits(objective.id, saved)
                        : false;
                      const isAdded = !!saved && !needsUpdate;

                      return (
                        <button
                          className={`min-w-[92px] cursor-pointer text-white px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-1.5 disabled:cursor-not-allowed ${
                            isAdded
                              ? "bg-green-600 disabled:opacity-100"
                              : "bg-teal-700 hover:bg-teal-800 disabled:opacity-50"
                          }`}
                          onClick={() => handleAddService(objective)}
                          disabled={
                            isAdding ||
                            isAdded ||
                            !id ||
                            !objective.label.trim() ||
                            (objectiveCosts[objective.id] || 0) === 0 ||
                            (objectiveTimelines[objective.id] || 0) === 0
                          }
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Adding...
                            </>
                          ) : isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Added
                            </>
                          ) : needsUpdate ? (
                            "Update"
                          ) : (
                            "Add"
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {selectedObjectives.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border-gray-300 border-2 border-dashed rounded-md bg-gray-50">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No services selected</h3>
              <p className="text-gray-500 mb-4">
                Please select the services you'd like to include in your
                proposal.
              </p>
            </div>
          )}
        </div>

        <div>
          {/* Project Summary */}
          <div className="border border-gray-300 rounded-md p-4 mb-4">
            <h3 className="font-medium text-lg mb-4 border-l-4 border-amber-500 pl-2">
              Project Summary
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Active Objectives:</p>
              <p className="font-medium">{selectedObjectives.length} / 8</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Services</p>
                {savedServices.length > 0 ? (
                  <button
                    type="button"
                    onClick={openServicesModal}
                    title="View and remove added services"
                    className="font-medium text-teal-700 underline underline-offset-4 decoration-dotted hover:text-teal-900 cursor-pointer"
                  >
                    {savedServices.length}
                  </button>
                ) : (
                  <p className="font-medium">0</p>
                )}
                <p className="text-xs text-gray-500">
                  {savedServices.length > 0 ? "added" : "objectives"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Cost</p>
                <p className="font-medium">${totalCost.toLocaleString()}</p>
                <p className="text-xs text-gray-500">total</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Timeline</p>
                <p className="font-medium">{totalWeeks}</p>
                <p className="text-xs text-gray-500">weeks</p>
              </div>
            </div>

            {/* Credits */}
            {/* <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Credits</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCredit(!showAddCredit)}
                >
                  + Add Credit
                </Button>
              </div>

              {credits.length > 0 && (
                <div className="space-y-2 mb-3">
                  {credits.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {credit.description || "Credit"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {credit.type === "dollar"
                            ? `$${credit.amount.toLocaleString()}`
                            : `${credit.amount}%`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCredits(credits.filter((c) => c.id !== credit.id))
                        }
                      >
                        <span className="text-red-500">×</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {showAddCredit && (
                <div className="border p-3 rounded-md mb-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label htmlFor="creditType" className="text-xs mb-2">
                        Type
                      </Label>
                      <Select
                        value={newCredit.type}
                        onValueChange={(value) =>
                          setNewCredit({
                            ...newCredit,
                            type: value as "dollar" | "percentage",
                          })
                        }
                      >
                        <SelectTrigger id="creditType" className="h-8 text-sm ">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="dollar">Dollar Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="creditAmount" className="text-xs mb-2">
                        Amount
                      </Label>
                      <div className="flex items-center">
                        {newCredit.type === "dollar" && (
                          <span className="text-sm mr-1">$</span>
                        )}
                        <Input
                          id="creditAmount"
                          type="number"
                          min="0"
                          value={newCredit.amount.toString()}
                          onChange={(e) =>
                            setNewCredit({
                              ...newCredit,
                              amount: Number(e.target.value),
                            })
                          }
                          className="h-8 text-sm"
                        />
                        {newCredit.type === "percentage" && (
                          <span className="text-sm ml-1">%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 mt-2">
                    <Label htmlFor="creditDescription" className="text-xs mb-2">
                      Description
                    </Label>
                    <Input
                      id="creditDescription"
                      value={newCredit.description}
                      onChange={(e) =>
                        setNewCredit({
                          ...newCredit,
                          description: e.target.value,
                        })
                      }
                      className="h-8 text-sm"
                      placeholder="Early payment discount, etc."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCredit(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-gray-800 text-white cursor-pointer"
                      size="sm"
                      onClick={() => {
                        setCredits([
                          ...credits,
                          { ...newCredit, id: Date.now().toString() },
                        ]);
                        setNewCredit({
                          id: "",
                          type: "dollar",
                          amount: 0,
                          description: "",
                        });
                        setShowAddCredit(false);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {credits.length > 0 && (
                <div className="text-sm text-gray-500">
                  Total Credits: ${calculateTotalCredits().toLocaleString()}
                </div>
              )}
            </div> */}

            {/* Final Cost */}
            <div className="border-t border-gray-300 pt-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Final Cost </p>
              <p className="text-xl font-medium text-green-600">
                ${finalCost.toLocaleString()}
              </p>
              {credits.length > 0 ? (
                <p className="text-xs text-gray-500">
                  After ${calculateTotalCredits().toLocaleString()} in credits
                </p>
              ) : (
                <p className="text-xs text-gray-500">No credits applied</p>
              )}
            </div>

            {/* Payment Type — the platform supports exactly these two. */}
            <div>
              <p className="text-sm font-medium mb-2">Payment Type</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="installments"
                    name="paymentMethod"
                    value="installments"
                    checked={paymentMethod === "installments"}
                    onChange={() => setPaymentMethod("installments")}
                    className="mr-2"
                  />
                  <label htmlFor="installments" className="text-sm">
                    Pay by phase completion
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="lumpSum"
                    name="paymentMethod"
                    value="lumpSum"
                    checked={paymentMethod === "lumpSum"}
                    onChange={() => setPaymentMethod("lumpSum")}
                    className="mr-2"
                  />
                  <label htmlFor="lumpSum" className="text-sm">
                    Lump sum
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {paymentMethod === "lumpSum"
                    ? "Client pays the full amount upfront."
                    : "An installment falls due as each phase is completed, priced from that phase's service."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isContinuing}
          className="cursor-pointer"
        >
          Back
        </Button>
        <Button
          onClick={persistOrderThenContinue}
          disabled={isContinuing}
          className="bg-gray-800 text-white cursor-pointer hover:bg-black min-w-[180px]"
        >
          {isContinuing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue to Review"
          )}
        </Button>
      </div>

      {/* Added services — deselect any the PM no longer wants and remove them */}
      <Dialog
        open={showServicesModal}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setShowServicesModal(false);
        }}
      >
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Added Services</DialogTitle>
            <p className="text-sm text-gray-500">
              Uncheck any service you want to take off this proposal, then
              remove it.
            </p>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto space-y-2 py-1">
            {savedServices.map((service) => {
              const isKept = removalSelection[service.id] !== false;
              return (
                <label
                  key={service.id}
                  htmlFor={`saved-service-${service.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isKept
                      ? "border-gray-200 bg-white"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <Checkbox
                    id={`saved-service-${service.id}`}
                    checked={isKept}
                    onCheckedChange={(checked) =>
                      setRemovalSelection((prev) => ({
                        ...prev,
                        [service.id]: checked === true,
                      }))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isKept ? "text-gray-900" : "text-red-700 line-through"
                      }`}
                    >
                      {service.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${Number(service.amount || 0).toLocaleString()} ·{" "}
                      {service.timelineWeeks || 0} wks · order {service.order}
                    </p>
                  </div>
                </label>
              );
            })}

            {savedServices.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">
                No services have been added yet.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowServicesModal(false)}
              disabled={isRemoving}
              className="cursor-pointer"
            >
              Close
            </Button>
            <Button
              onClick={handleRemoveDeselected}
              disabled={
                isRemoving ||
                savedServices.every((s) => removalSelection[s.id] !== false)
              }
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove{" "}
                  {savedServices.filter((s) => removalSelection[s.id] === false)
                    .length || ""}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
