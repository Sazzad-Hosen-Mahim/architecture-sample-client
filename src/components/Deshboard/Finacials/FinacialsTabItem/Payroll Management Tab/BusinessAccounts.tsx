import { useState } from "react";
import {
  CreditCard,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  useGetMercuryAccountsQuery,
  useGetMercuryTransactionsQuery,
} from "@/redux/api/financialApi";
import { Loader } from "@/components/ui/loader";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Pending";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAccountTypeBadge(type: string, kind: string) {
  const label = kind || type || "Account";
  const isChecking =
    kind?.toLowerCase().includes("checking") ||
    type?.toLowerCase().includes("checking");
  const isSavings =
    kind?.toLowerCase().includes("savings") ||
    type?.toLowerCase().includes("savings") ||
    kind?.toLowerCase().includes("treasury");

  if (isSavings) {
    return (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
        {label}
      </span>
    );
  }
  return (
    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
      {isChecking ? "Checking" : label}
    </span>
  );
}

export function BusinessAccounts() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [txLimit] = useState(5);

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
    error: accountsError,
    refetch: refetchAccounts,
  } = useGetMercuryAccountsQuery(undefined, {
    // A failed Mercury call (bad/rotated API key) otherwise stays cached for the
    // whole session — remounting the tab would keep showing the old error.
    refetchOnMountOrArgChange: true,
  });

  const {
    data: txData,
    isLoading: isLoadingTx,
    isFetching: isFetchingTx,
  } = useGetMercuryTransactionsQuery(
    { accountId: selectedAccountId!, limit: txLimit },
    { skip: !selectedAccountId, refetchOnMountOrArgChange: true }
  );

  const accounts = accountsData?.accounts || [];
  const transactions = txData?.transactions || [];

  // Auto-select first account once loaded
  if (accounts.length > 0 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].id);
  }

  // ─── Loading state ───
  if (isLoadingAccounts) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
        <Loader fullScreen={false} />
      </div>
    );
  }

  // ─── Error state ───
  if (isAccountsError) {
    const errMsg =
      (accountsError as any)?.data?.message ||
      "Failed to connect to Mercury banking API";
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
        <p className="text-sm font-medium text-red-800 mb-1">
          Connection Failed
        </p>
        <p className="text-xs text-red-600 text-center mb-4 max-w-xs">
          {errMsg}
        </p>
        <button
          onClick={() => refetchAccounts()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  // ─── Empty state ───
  if (accounts.length === 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
        <Building2 className="w-8 h-8 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600">No accounts found</p>
        <p className="text-xs text-gray-500 mt-1">
          Check your Mercury API key configuration
        </p>
      </div>
    );
  }

  const totalBalance = accounts.reduce(
    (sum: number, acc: any) => sum + (acc.currentBalance || 0),
    0
  );

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Business Accounts
          </h2>
          <p className="text-xs text-gray-600 mt-1">Mercury Banking</p>
        </div>
        <button
          onClick={() => refetchAccounts()}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
          title="Refresh accounts"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Total Balance */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 mb-4 text-white">
        <p className="text-xs font-medium text-blue-200 mb-1">Total Balance</p>
        <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
        <p className="text-xs text-blue-200 mt-1">
          Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Account Cards */}
      {accounts.map((account: any, index: number) => (
        <div
          key={account.id}
          className={`bg-white rounded-lg p-4 mb-4 border cursor-pointer transition-all ${
            selectedAccountId === account.id
              ? "border-blue-400 ring-1 ring-blue-200"
              : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => setSelectedAccountId(account.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-500 font-medium">
              {account.nickname || account.name || `Account ${index + 1}`}
            </p>
            <div
              className={`w-2 h-2 rounded-full ${
                account.status === "active" ? "bg-green-500" : "bg-gray-400"
              }`}
              title={account.status}
            />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-2">
            {formatCurrency(account.currentBalance || 0)}
          </p>
          {account.availableBalance !== account.currentBalance && (
            <p className="text-xs text-gray-500 mb-2">
              Available: {formatCurrency(account.availableBalance || 0)}
            </p>
          )}
          <div className="flex gap-2 mb-3">
            {getAccountTypeBadge(account.type, account.kind)}
            {index === 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Default
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex flex-col gap-1 w-[80%]">
              <div className="flex items-center gap-2 justify-between">
                <div className="text-gray-600 w-20">Account:</div>
                <div className="text-gray-600 font-medium font-mono text-xs">
                  {account.accountNumber}
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <div className="text-gray-600 w-20">Routing:</div>
                <div className="text-gray-600 font-medium font-mono text-xs">
                  {account.routingNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Recent Transactions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4 border-b py-2 border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">
            Recent Transactions
          </h3>
          {isFetchingTx && (
            <Loader2 size={14} className="text-blue-500 animate-spin" />
          )}
        </div>

        {isLoadingTx ? (
          <Loader fullScreen={false} size={8} />
        ) : transactions.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No recent transactions
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 p-1 rounded-full ${
                        isCredit ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft
                          size={10}
                          className="text-green-600"
                        />
                      ) : (
                        <ArrowUpRight size={10} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 leading-tight">
                        {tx.counterpartyName ||
                          tx.bankDescription ||
                          tx.externalMemo ||
                          "Transaction"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.postedAt || tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-medium whitespace-nowrap ${
                      isCredit ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isCredit ? "+" : ""}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        <button
          onClick={() => refetchAccounts()}
          className="border cursor-pointer border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
        <button className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 justify-center">
          <Search size={14} />
          Search
        </button>
      </div>
    </div>
  );
}
