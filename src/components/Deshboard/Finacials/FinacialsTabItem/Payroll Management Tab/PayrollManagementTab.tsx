import AccountantDesk from "./AccountantDesk";
import { BusinessAccounts } from "./BusinessAccounts";
import { PendingApprovalsPayroll } from "./PendingApprovalsPayroll";

export default function PayrollManagementTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Business Accounts Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Business Accounts</h2>
        </div>
        <BusinessAccounts />
      </section>

      {/* 2. Pending Approvals & Payroll Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1 h-6 bg-green-500 rounded-full" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Pending Approvals & Payroll</h2>
        </div>
        <PendingApprovalsPayroll />
      </section>

      {/* 3. Accountant's Desk (Global Controls) */}
      <section className="space-y-4 md:col-span-2">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1 h-6 bg-black rounded-full" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Accountant's Central Controls</h2>
        </div>
        <AccountantDesk />
      </section>

      {/* Instructional Footer */}
      {/* <footer className="bg-gray-50 border border-gray-100 rounded-3xl p-8 flex items-start gap-6 mt-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Administrative Notice</h4>
          <p className="text-xs text-gray-500 leading-relaxed font-medium max-w-3xl">
            The <strong>Accountant's Desk</strong> serves as the master switch for firm financials. Adjustments to the <strong>Global Billing Rate</strong> will update projections across all active projects. Ensure all <strong>Pending Approvals</strong> are cleared before final payroll processing to maintain audit compliance.
          </p>
        </div>
      </footer> */}
    </div>
  );
}
