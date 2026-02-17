import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
// import { useParams } from "react-router-dom";
import { useAddServiceMutation } from "@/redux/api/adminDashboard/proposalApi";
import Cookies from "js-cookie";

interface Credit {
  id: string;
  type: "dollar" | "percentage";
  amount: number;
  description: string;
}

interface Objective {
  id: string;
  label: string;
}

interface ServicesFormProps {
  objectives: Objective[];
  selectedObjectives: string[];
  toggleObjective: (id: string) => void;
  objectiveCosts: Record<string, number>;
  objectiveTimelines: Record<string, number>;
  handleCostChange: (id: string, value: string) => void; // changed to string
  handleTimelineChange: (id: string, value: string) => void; // changed to string
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
  credits,
  setCredits,
  calculateTotalCredits,
  totalCost,
  totalWeeks,
  finalCost,
  paymentMethod,
  setPaymentMethod,
  handleNext,
  handleBack,
}: ServicesFormProps) {
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [newCredit, setNewCredit] = useState<Credit>({
    id: "",
    type: "dollar",
    amount: 0,
    description: "",
  });

  // const { id } = useParams();

  const proposalData = Cookies.get("proposal_data") || "";
  const parsedProposalData = JSON.parse(proposalData);
  console.log(parsedProposalData, "proposalData")
  const id = parsedProposalData?.data?.id;
  console.log(id, "id in service scope @@@@@@@@@@@@@@")

  const [addService] = useAddServiceMutation();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold border-l-4 border-blue-600 pl-3">
          Scope of Services
        </h2>
        <span className="ml-4 text-sm text-gray-500">
          Selected: {selectedObjectives.length} / 8
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {objectives.map((objective) => (
            <div
              key={objective.id}
              className="mb-4 border rounded-md overflow-hidden"
            >
              <div className="flex items-center p-3 bg-gray-50">
                <Checkbox
                  id={objective.id}
                  checked={selectedObjectives.includes(objective.id)}
                  onCheckedChange={() => toggleObjective(objective.id)}
                  className="mr-3"
                />
                <label
                  htmlFor={objective.id}
                  className="font-medium cursor-pointer flex-grow"
                >
                  {objective.label}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-1">$</span>
                    <Input
                      type="number"
                      min="0"
                      //   value={objectiveCosts[objective.id]?.toString() || "0"}
                      //   onChange={(e) =>
                      //     handleCostChange(objective.id, e.target.value)
                      //   }
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
                      //   value={
                      //     objectiveTimelines[objective.id]?.toString() || "0"
                      //   }
                      //   onChange={(e) =>
                      //     handleTimelineChange(objective.id, e.target.value)
                      //   }
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
                    <button
                      className="bg-teal-700 cursor-pointer hover:bg-teal-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async () => {
                        if (!id) {
                          alert("Project ID is missing");
                          return;
                        }

                        const cost = Number(objectiveCosts[objective.id]) || 0;
                        const timelineWeeks = Number(objectiveTimelines[objective.id]) || 0;

                        if (cost === 0 || timelineWeeks === 0) {
                          alert("Please enter both cost and timeline before adding the service");
                          return;
                        }

                        const payload = {
                          name: objective.label,
                          cost: cost,
                          timelineWeeks: timelineWeeks,
                          id: id
                        };

                        console.log("=== ADDING SERVICE ===");
                        console.log("Objective:", objective);
                        console.log("Payload:", payload);
                        console.log("Name type:", typeof payload.name, "Value:", payload.name);
                        console.log("Cost type:", typeof payload.cost, "Value:", payload.cost);
                        console.log("TimelineWeeks type:", typeof payload.timelineWeeks, "Value:", payload.timelineWeeks);
                        console.log("ID type:", typeof payload.id, "Value:", payload.id);

                        try {
                          const result = await addService(payload).unwrap();
                          console.log("Service added successfully:", result);
                          alert(`Service "${objective.label}" added successfully!`);
                        } catch (error) {
                          console.error("Failed to add service:", error);
                          alert("Failed to add service. Please try again.");
                        }
                      }}
                      disabled={!id || (objectiveCosts[objective.id] || 0) === 0 || (objectiveTimelines[objective.id] || 0) === 0}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {selectedObjectives.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-md bg-gray-50">
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
          <div className="border rounded-md p-4 mb-4">
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
                <p className="font-medium">{selectedObjectives.length}</p>
                <p className="text-xs text-gray-500">objectives</p>
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
            <div className="mb-4">
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
            </div>

            {/* Final Cost */}
            <div className="border-t pt-4 mb-4">
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

            {/* Payment Method */}
            <div>
              <p className="text-sm font-medium mb-2">Payment Method</p>
              <div className="space-y-2">
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
                    Lump Sum Payment
                  </label>
                </div>
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
                    Installment Payments (per objective)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Client will pay the full amount upfront
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
          className="cursor-pointer"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-gray-800 text-white cursor-pointer hover:bg-black"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
