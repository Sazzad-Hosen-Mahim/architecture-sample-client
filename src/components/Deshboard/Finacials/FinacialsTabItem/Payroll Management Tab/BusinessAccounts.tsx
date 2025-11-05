import { CreditCard, Search } from "lucide-react";

export function BusinessAccounts() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Business Accounts
        </h2>
        <p className="text-xs text-gray-600 mt-1">Connected banking</p>
      </div>

      {/* Primary Account */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="">
          <p className="text-xs text-gray-500 font-medium mb-2">
            Primary Account
          </p>
          <p className="text-sm font-bold text-gray-900 mb-2">$125,000.00</p>
          <div className="flex gap-2 mb-3">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Default
            </span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Checking
            </span>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex flex-col gap-1 w-[80%] ">
            <div className="flex items-center gap-2 justify-between">
              <div className="text-gray-600 w-20">Account:</div>
              <div className="text-gray-600 font-medium">•••••••1234</div>
            </div>

            <div className="flex items-center gap-2 justify-between">
              <div className="text-gray-600 w-20">Bank:</div>
              <div className="text-gray-600 font-medium">Chase Bank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reserve Account */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <p className="text-xs text-gray-500 font-medium mb-2">
          Reserve Account
        </p>
        <p className="text-sm font-bold text-gray-900 mb-2">$250,000.00</p>
        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Savings
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex flex-col gap-1 w-[80%] ">
            <div className="flex items-center gap-2 justify-between">
              <div className="text-gray-600 w-20">Account:</div>
              <div className="text-gray-600 font-medium">•••••••1234</div>
            </div>

            <div className="flex items-center gap-2 justify-between">
              <div className="text-gray-600 w-20">Bank:</div>
              <div className="text-gray-600 font-medium">Chase Bank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4   border-b py-2 border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">
            Recent Transactions
          </h3>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700 ">
            View All
          </a>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Payroll Payment
              </p>
              <p className="text-xs text-gray-500">Apr 20, 2023</p>
            </div>
            <p className="text-sm font-medium text-red-600">-$12,094.23</p>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Client Payment - XYZ Corp
              </p>
              <p className="text-xs text-gray-500">Apr 18, 2023</p>
            </div>
            <p className="text-sm font-medium text-green-600">+$15,000.00</p>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Software Subscription
              </p>
              <p className="text-xs text-gray-500">Apr 15, 2023</p>
            </div>
            <p className="text-sm font-medium text-red-600">-$99.00</p>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Client Payment - ABC Inc
              </p>
              <p className="text-xs text-gray-500">Apr 12, 2023</p>
            </div>
            <p className="text-sm font-medium text-green-600">+$8,500.00</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        <button className="border cursor-pointer border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          + Add Account
        </button>
        <button className="flex  cursor-pointer items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <Search size={14} />
          Search Transactions
        </button>
      </div>
    </div>
  );
}
