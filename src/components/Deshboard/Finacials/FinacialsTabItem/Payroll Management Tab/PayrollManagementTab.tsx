import { BusinessAccounts } from "./BusinessAccounts";
import { NextPayPeriod } from "./NextPayPeriod";
import { PendingApprovalsPayroll } from "./PendingApprovalsPayroll";
import { Plus } from "lucide-react";

export default function PayrollManagementTab() {
  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-600">
              Payroll Management
            </h1>
            <p className="text-xs text-gray-600">Bi-Weekly</p>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <option>Bi-Weekly</option>
            </select>
            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-800">
              <Plus size={16} /> Connect Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BusinessAccounts />
          <NextPayPeriod />
          <PendingApprovalsPayroll />
        </div>
      </main>
    </div>
  );
}
