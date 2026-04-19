"use client";

import { CheckCircle, Clock, Users, Eye } from "lucide-react";
import { useState } from "react";
import TeamManagementModa from "../approvalsModal/TeamManagementModa";
import {
  useGetPendingTimecardsQuery,
  useApproveTimecardMutation,
  useRejectTimecardMutation
} from "@/redux/api/financialApi";
import { toast } from "sonner";
import TimesheetEntryFormDialog from "../../../TimeCardDialog/TimesheetEntryFormDialog";

export function PendingApprovalsPayroll() {
  const [employeesModalOpen, setEmployeesModalOpen] = useState(false);
  const [selectedTimecardId, setSelectedTimecardId] = useState<string | null>(null);

  const { data: pendingTimecards = [], isLoading } = useGetPendingTimecardsQuery();
  const [approveTimecard, { isLoading: isApproving }] = useApproveTimecardMutation();
  const [rejectTimecard, { isLoading: isRejecting }] = useRejectTimecardMutation();

  const handleApprove = async (id: string) => {
    try {
      await approveTimecard(id).unwrap();
      toast.success("Timecard approved");
    } catch (err: any) {
      toast.error(err?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    const note = prompt("Please enter a reason for rejection:");
    if (note === null) return;
    try {
      await rejectTimecard({ id, rejectionNote: note }).unwrap();
      toast.success("Timecard rejected");
    } catch (err: any) {
      toast.error(err?.data?.message || "Rejection failed");
    }
  };

  return (
    <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 h-full font-semibold">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Pending Approvals & Payroll
        </h2>
        <p className="text-xs text-gray-600 mt-1 font-medium">
          Timecards and current payroll status
        </p>
      </div>

      {/* Pending Items */}
      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading pending approvals...</p>
        ) : pendingTimecards.length === 0 ? (
          <p className="text-sm text-gray-500 font-medium italic">No pending timecards for approval.</p>
        ) : (
          pendingTimecards.map((tc: any) => (
            <div key={tc.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm transition-all hover:border-green-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{tc.user?.name}</p>
                    <p className="text-xs text-gray-500">{tc.user?.role?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  {tc.status}
                </span>
              </div>

              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Week Ending:</span>
                  <span className="font-medium text-gray-700">{new Date(tc.weekEnding).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Hours:</span>
                  <span className="font-medium text-gray-700">{Number(tc.totalHours).toFixed(2)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Cost:</span>
                  <span className=" text-gray-700 font-bold">${Number(tc.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-2 font-medium">
                <button
                  onClick={() => setSelectedTimecardId(tc.id)}
                  className="flex-1 flex items-center justify-center gap-1 border cursor-pointer border-gray-300 rounded-lg py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} /> View
                </button>
                <button
                  onClick={() => handleApprove(tc.id)}
                  disabled={isApproving}
                  className="flex-1 bg-green-100 cursor-pointer border border-green-200 text-green-700 rounded-lg py-2 text-xs hover:bg-green-700 hover:text-white transition-all disabled:opacity-50"
                >
                  {isApproving ? "..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(tc.id)}
                  disabled={isRejecting}
                  className="flex-1 bg-red-100 cursor-pointer border border-red-200 text-red-700 rounded-lg py-2 text-xs hover:bg-red-700 hover:text-white transition-all disabled:opacity-50"
                >
                  {isRejecting ? "..." : "Deny"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payroll Summary */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mt-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-bold text-gray-900">Payroll Context</h3>
          <span className="text-xs text-green-600 font-bold">Bi-Weekly</span>
        </div>

        <div className="space-y-3 text-sm mb-4 font-medium">
          <div className="flex justify-between">
            <span className="text-gray-500">Pending Approvals:</span>
            <span className="font-bold text-gray-900">{pendingTimecards.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Next Pay Date:</span>
            <span className="font-bold text-gray-700">5/20/2023</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Deadline:</span>
            <span className="text-orange-600 font-bold flex items-center gap-1">
              <Clock className="w-4 h-4" />
              In 3 days
            </span>
          </div>
        </div>

        <button
          onClick={() => setEmployeesModalOpen(true)}
          className="group cursor-pointer relative w-full text-xs flex items-center justify-center gap-2 rounded-lg border border-gray-900 bg-white px-4 py-2.5 font-bold text-gray-900 hover:text-white transition-all duration-200 hover:bg-black active:scale-[0.98]"
        >
          <Users className="h-4 w-4 text-gray-500 transition-colors duration-200 group-hover:text-white" />
          <span>Manage Team Registry</span>
        </button>
      </div>

      <TeamManagementModa
        open={employeesModalOpen}
        onOpenChange={setEmployeesModalOpen}
      />

      {selectedTimecardId && (
        <TimesheetEntryFormDialog
          open={!!selectedTimecardId}
          onOpenChange={(isOpen: boolean) => !isOpen && setSelectedTimecardId(null)}
          timecardId={selectedTimecardId}
        />
      )}
    </div>
  );
}
