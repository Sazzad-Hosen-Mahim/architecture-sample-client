// import React from "react";

// export default function NextPayPeriod() {
//   return <div>NextPayPeriod</div>;
// }

import { AlertCircle, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import PayrollReviewDialog from "./ProcessPayrolModal/PayrollReviewDialog";

export function NextPayPeriod() {
  const [payPeriodAlerts] = useState({
    paymentFrequency: "bi-weekly", // 'bi-weekly' or 'monthly'
    nextPayPeriod: {
      startDate: "2023-05-01",
      endDate: "2023-05-15",
      payDate: "2023-05-20",
      daysRemaining: 3,
      status: "upcoming", // 'upcoming', 'due', 'overdue', 'processed'
      accumulatedHours: {
        approved: 320, // Total approved hours for this pay period
        pending: 40, // Hours still pending approval
        total: 360, // Total expected hours
      },
    },
    missedPayPeriods: [
      {
        id: "missed-1",
        startDate: "2023-04-16",
        endDate: "2023-04-30",
        payDate: "2023-05-05",
        daysOverdue: 2,
        accumulatedHours: {
          approved: 280,
          pending: 0,
          total: 280,
        },
      },
    ],
  });
  const [showPayrollReviewDialog, setShowPayrollReviewDialog] = useState(false);
  const [currentPayPeriodId, setCurrentPayPeriodId] = useState<
    string | undefined
  >(undefined);
  const handleProcessPayroll = (payPeriodId?: string) => {
    // Store the pay period ID and open the review dialog
    setCurrentPayPeriodId(payPeriodId);
    setShowPayrollReviewDialog(true);
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          Next Pay Period
        </h2>
        <p className="text-xs text-gray-600 mt-1">Due in 3 days</p>
      </div>

      {/* Pay Period Details */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Period:</span>
          <span className="text-sm font-medium text-gray-600">
            5/1/2023 - 5/15/2023
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Pay Date:</span>
          <span className="text-sm font-medium text-gray-600">5/20/2023</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Employees:</span>
          <span className="text-sm font-medium text-gray-600">5</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Hours Status:</span>
          <span className="text-sm font-medium flex gap-1">
            <span className="text-green-600">320 approved</span>
            <span className="text-gray-600">/</span>
            <span className="text-yellow-600">40 pending</span>
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Estimated Total:</span>
          <span className="text-sm font-medium text-gray-600">$24,750.00</span>
        </div>
      </div>

      {/* Missed Pay Periods Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className=" ">
          <div className="flex gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-900 mb-1">
              Missed Pay Periods
            </p>
          </div>
          <div className="flex-1 ">
            <div className="bg-white w-full rounded-md p-2 flex justify-between items-start">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-red-800">4/16/2023 - 4/30/2023</p>
                <p className="text-xs text-red-700">
                  Due: 5/5/2023 (2 days overdue)
                </p>
                <p className="text-xs text-red-700">280 hours approved</p>
              </div>
              <button className="px-6 py-1 border text-xs border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors duration-200">
                Process
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Process Payroll Button */}
      <button
        onClick={() => handleProcessPayroll()}
        className="w-full bg-black text-white rounded-lg py-2.5 text-xs hover:bg-gray-900 flex items-center justify-center gap-2 transition-colors duration-200"
      >
        <DollarSign className="w-4 h-4" />
        Process Payroll
      </button>

      {/* Process Button for Missed */}
      {/* here ??    */}
      <PayrollReviewDialog
        open={showPayrollReviewDialog}
        onOpenChange={setShowPayrollReviewDialog}
        currentPayPeriodId={currentPayPeriodId}
        payPeriodAlerts={payPeriodAlerts}
      />
    </div>
  );
}
