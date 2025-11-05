// import React from "react";

// export default function PendingApprovalsPayroll() {
//   return <div>PendingApprovalsPayroll</div>;
// }

import { CheckCircle, Clock, Users } from "lucide-react";
import { useState } from "react";
import TeamManagementModa from "../approvalsModal/TeamManagementModa";

export function PendingApprovalsPayroll() {
  const [employeesModalOpen, setEmployeesModalOpen] = useState(false);
  return (
    <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Pending Approvals & Payroll
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          Timecards and current payroll status
        </p>
      </div>

      {/* Employee Card */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div> */}
            <div>
              <p className="font-semibold text-gray-600">Jane Smith</p>
              <p className="text-xs text-gray-500">Employee</p>
            </div>
          </div>
          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
            Pending
          </span>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Week Starting:</span>
            <span className="font-medium text-gray-600">6/5/2023</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Hours:</span>
            <span className="font-medium text-gray-600">40 hours</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 border  cursor-pointer  border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            View
          </button>
          <button className="flex-1 bg-green-100   cursor-pointer border border-green-700 text-green-600 rounded-lg py-2 text-sm font-medium hover:text-white hover:bg-green-700">
            Approve
          </button>
          <button className="flex-1 border bg-red-100  cursor-pointer  border-red-300 text-red-600 rounded-lg py-2 text-sm font-medium hover:bg-red-300 hover:text-white">
            Deny
          </button>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-600">Payroll Summary</h3>
          <a
            href="#"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Process
          </a>
        </div>

        <div className="space-y-3 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Pay Period:</span>
            <span className="font-medium text-gray-600">$320 hrs approved</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Total:</span>
            <span className="font-medium text-gray-600">$24,750.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Next Pay Date:</span>
            <span className="font-medium text-gray-600">5/20/2023</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className="text-orange-600 font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Due in 3 days
            </span>
          </div>
        </div>

        <button
          onClick={() => setEmployeesModalOpen(true)}
          className="group cursor-pointer relative w-full text-xs flex items-center justify-center gap-2 rounded-lg border border-gray-900 bg-white px-4 py-2  text-gray-700 hover:text-white transition-all duration-200 hover:border-gray-900 hover:bg-black  active:scale-[0.98]"
        >
          <Users className="h-4 w-4 text-gray-500 transition-colors duration-200 group-hover:text-white" />
          <span>Manage Team</span>
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></span>
        </button>
      </div>
      <TeamManagementModa
        open={employeesModalOpen}
        onOpenChange={setEmployeesModalOpen}
      />
    </div>
  );
}
